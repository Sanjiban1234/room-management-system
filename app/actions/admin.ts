'use server';

import { db } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcrypt';

async function ensureAdmin() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized: Admin session required');
  }
  return session;
}

// Volunteers
export async function getVolunteers() {
  await ensureAdmin();
  const snapshot = await db.collection('volunteers').orderBy('name', 'asc').get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
}

export async function createVolunteer(data: { name: string, faculty: string, batch: string, phone: string }) {
  await ensureAdmin();
  const newRef = db.collection('volunteers').doc();
  await newRef.set({ ...data, createdAt: new Date().toISOString() });
  revalidatePath('/admin/volunteers');
}

export async function deleteVolunteer(id: string) {
  await ensureAdmin();
  await db.collection('volunteers').doc(id).delete();
  revalidatePath('/admin/volunteers');
}

export async function importVolunteersBulk(volunteers: { name: string, faculty: string, batch: string, phone: string }[]) {
  await ensureAdmin();
  const batch = db.batch();
  for (const vol of volunteers) {
    const ref = db.collection('volunteers').doc();
    batch.set(ref, { ...vol, createdAt: new Date().toISOString() });
  }
  await batch.commit();
  revalidatePath('/admin/volunteers');
}

export async function deleteAllVolunteerApplicants() {
  await ensureAdmin();
  const snapshot = await db.collection('volunteerApplicants').get();
  const batch = db.batch();
  snapshot.docs.forEach((doc: any) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  revalidatePath('/admin/applicants');
}

export async function getPerformanceRegistrations() {
  await ensureAdmin();
  const snapshot = await db.collection('performanceRegistrations').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
}

export async function deleteAllPerformanceRegistrations() {
  await ensureAdmin();
  const snapshot = await db.collection('performanceRegistrations').get();
  const batch = db.batch();
  snapshot.docs.forEach((doc: any) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  revalidatePath('/admin/performances');
}

// System Settings
export async function getSystemSetting(key: string) {
  // getSystemSetting is used in public Home page, keep it accessible but validate it's simple
  const doc = await db.collection('systemSettings').doc(key).get();
  return doc.exists ? doc.data()?.value : null;
}

export async function updateSystemSetting(key: string, value: string) {
  await ensureAdmin();
  await db.collection('systemSettings').doc(key).set({
    key,
    value,
    updatedAt: new Date().toISOString()
  });
  revalidatePath('/');
  revalidatePath('/admin/settings');
}

export async function toggleCallForVolunteers(enabled: boolean) {
  await ensureAdmin();
  await updateSystemSetting('callForVolunteers', enabled ? 'true' : 'false');
}

export async function toggleCallForPerformance(enabled: boolean) {
  await ensureAdmin();
  await updateSystemSetting('callForPerformance', enabled ? 'true' : 'false');
}

// Admin Management
export async function getAdmins() {
  await ensureAdmin();
  const snapshot = await db.collection('admins').orderBy('username', 'asc').get();
  return snapshot.docs.map((doc: any) => ({ 
    id: doc.id, 
    username: doc.data().username, 
    createdAt: doc.data().createdAt 
  }));
}

export async function upsertAdmin(data: { id?: string, username: string, password?: string }) {
  await ensureAdmin();
  const { id, password } = data;
  const username = data.username.toLowerCase();
  
  if (id) {
    const updateData: any = { username, updatedAt: new Date().toISOString() };
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    await db.collection('admins').doc(id).update(updateData);
  } else {
    // Check if username exists
    const querySnapshot = await db.collection('admins').where('username', '==', username).limit(1).get();
    if (!querySnapshot.empty) {
      const existingId = querySnapshot.docs[0].id;
      const updateData: any = { username, updatedAt: new Date().toISOString() };
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }
      await db.collection('admins').doc(existingId).update(updateData);
    } else {
      if (!password) throw new Error('Password is required for new admins');
      const passwordHash = await bcrypt.hash(password, 10);
      await db.collection('admins').doc().set({
        username,
        passwordHash,
        createdAt: new Date().toISOString()
      });
    }
  }
  revalidatePath('/admin/settings');
}

export async function deleteAdmin(id: string) {
  await ensureAdmin();
  // Prevent deleting the last admin
  const snapshot = await db.collection('admins').count().get();
  if (snapshot.data().count <= 1) {
    throw new Error('Cannot delete the last admin account.');
  }
  await db.collection('admins').doc(id).delete();
  revalidatePath('/admin/settings');
}

// Bookings
export async function cancelBooking(id: string) {
  await ensureAdmin();
  await db.collection('bookings').doc(id).update({
    status: 'cancelled',
    cancelledAt: new Date().toISOString()
  });
  revalidatePath('/admin/bookings');
  revalidatePath('/admin/dashboard');
}

// Time Slots
const DEFAULT_TIME_SLOTS = ['2:30-3:30', '3:30-4:30', '4:30-5:30'];

export async function getTimeSlots(): Promise<string[]> {
  try {
    const doc = await db.collection('systemSettings').doc('timeSlots').get();
    if (doc.exists) {
      const raw = doc.data()?.value;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_TIME_SLOTS;
}

export async function updateTimeSlots(slots: string[]) {
  await ensureAdmin();
  await db.collection('systemSettings').doc('timeSlots').set({
    key: 'timeSlots',
    value: JSON.stringify(slots),
    updatedAt: new Date().toISOString()
  });
  revalidatePath('/');
  revalidatePath('/admin/settings');
}

// Blocked Dates
export async function getBlockedDates() {
  await ensureAdmin();
  const snapshot = await db.collection('blockedDates').orderBy('date', 'asc').get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
}

export async function getBlockedDatesSimple() {
  // Publicly accessible for the booking calendar
  const snapshot = await db.collection('blockedDates').get();
  return snapshot.docs.map((doc: any) => doc.data().date);
}

export async function addBlockedDate(date: string, reason: string | null) {
  await ensureAdmin();
  const query = await db.collection('blockedDates').where('date', '==', date).limit(1).get();
  if (query.empty) {
    await db.collection('blockedDates').doc().set({
      date,
      reason,
      createdAt: new Date().toISOString()
    });
  } else {
    await db.collection('blockedDates').doc(query.docs[0].id).update({
      reason,
      updatedAt: new Date().toISOString()
    });
  }
  revalidatePath('/');
  revalidatePath('/admin/blocked-dates');
}

export async function deleteBlockedDate(id: string) {
  await ensureAdmin();
  await db.collection('blockedDates').doc(id).delete();
  revalidatePath('/');
  revalidatePath('/admin/blocked-dates');
}
