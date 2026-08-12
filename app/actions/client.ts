'use server';

import { db } from '@/lib/firebase';
import { getClientIp, checkRateLimit } from '@/lib/rate-limiter';
import {
  bookingSchema,
  applicantSchema,
  performanceSchema,
  type BookingData,
} from '@/lib/schemas';

const DEFAULT_TIME_SLOTS = ['2:30-3:30', '3:30-4:30', '4:30-5:30'];

export async function createBooking(data: BookingData) {
  try {
    const ip = await getClientIp();
    const rateLimit = await checkRateLimit('create_booking', ip, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Too many booking requests. Please try again after 15 minutes.' };
    }

    // 1. Validate Input
    const validated = bookingSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    // 2. Check for past date (security hardening)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(data.date);
    if (bookingDate < today) {
      return { success: false, error: "Cannot book for past dates." };
    }

    // 3. Check if date is blocked by admin
    const blockedDatesQuery = await db.collection('blockedDates').where('date', '==', data.date).limit(1).get();
    if (!blockedDatesQuery.empty) {
      return { success: false, error: "This date has been blocked by an administrator." };
    }

    // 4. Prevent overlapping bookings for the same date and time.
    // A transaction keeps this check safe when two clients submit at once.
    const bookingRef = db.collection('bookings').doc();
    const isSuccess = await db.runTransaction(async (transaction: any) => {
      const existingQuery = await transaction.get(
        db.collection('bookings')
          .where('date', '==', data.date)
          .where('timeSlot', '==', data.timeSlot)
      );

      const hasActiveBooking = !existingQuery.empty &&
        existingQuery.docs.some((doc: any) => (doc.data().status || 'active') !== 'cancelled');

      if (hasActiveBooking) {
        return false;
      }

      transaction.set(bookingRef, {
        ...validated.data,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      return true;
    });

    if (!isSuccess) {
      return { success: false, error: 'This slot has already been taken. Please choose another one.' };
    }

    return { success: true, bookingId: bookingRef.id };

  } catch (error) {
    console.error("Create Booking Error:", error);
    return { success: false, error: "An internal server error occurred." };
  }
}

export async function getBookings() {
  // 🛡️ SECURITY: Only return fields needed for availability checking.
  // DO NOT return name, phone, faculty, or batch to unauthenticated users.
  console.time('getBookings');
  try {
    const snapshot = await db.collection('bookings')
      .select('date', 'timeSlot', 'volunteerId', 'status')
      .get();
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date,
        timeSlot: data.timeSlot,
        volunteerId: data.volunteerId,
        status: data.status || 'active'
      };
    });
  } finally {
    console.timeEnd('getBookings');
  }
}

/** Returns only availability records for the day the visitor selected. */
export async function getBookingsByDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { success: false as const, error: 'Invalid booking date.', bookings: [] };
  }

  const timer = `getBookingsByDate:${date}`;
  console.time(timer);
  try {
    const snapshot = await db.collection('bookings')
      .where('date', '==', date)
      .where('status', '==', 'active')
      .select('date', 'timeSlot', 'volunteerId', 'status')
      .get();

    return {
      success: true as const,
      bookings: snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
    };
  } catch (error) {
    console.error('getBookingsByDate error:', error);
    return { success: false as const, error: 'Could not load availability. Please try again.', bookings: [] };
  } finally {
    console.timeEnd(timer);
  }
}

export async function getPublicVolunteers() {
  // 🛡️ SECURITY: Only return public info. Exclude phone numbers.
  console.time('getPublicVolunteers');
  try {
    const snapshot = await db.collection('volunteers')
      .orderBy('name', 'asc')
      .select('name', 'faculty', 'batch')
      .get();
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        faculty: data.faculty,
        batch: data.batch
      };
    });
  } finally {
    console.timeEnd('getPublicVolunteers');
  }
}

export async function getTimeSlots(): Promise<string[]> {
  console.time('getTimeSlots');
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
  } finally {
    console.timeEnd('getTimeSlots');
  }
  return DEFAULT_TIME_SLOTS;
}

export async function getPublicHomeSettings() {
  const timer = 'getPublicHomeSettings';
  console.time(timer);
  try {
    // Settings are stored with their key as the document ID, so direct reads
    // avoid the previous collection query and return only the value field.
    const keys = ['callForVolunteers', 'volunteerCallTopic', 'volunteerCallMessage', 'callForPerformance', 'performanceRegistrationClosedMessage'] as const;
    const docs = await db.getAll(...keys.map((key) => db.collection('systemSettings').doc(key)));
    return Object.fromEntries(docs.map((doc: any, index: number) => [keys[index], doc.data()?.value || ''])) as Record<typeof keys[number], string>;
  } finally {
    console.timeEnd(timer);
  }
}

export async function getBookingsByPhone(phone: string) {
  if (!phone || phone.trim().length < 7) {
    return { success: false, error: 'Please enter a valid phone number.' };
  }

  const ip = await getClientIp();
  const rateLimit = await checkRateLimit('lookup_bookings', ip, 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { success: false, error: 'Too many lookup requests. Please try again after 15 minutes.' };
  }

  try {
    // Note: orderBy('date') combined with where('phone') needs a composite index.
    // Sort in JS to avoid requiring index setup.
    const snapshot = await db
      .collection('bookings')
      .where('phone', '==', phone.trim())
      .get();

    if (snapshot.empty) {
      return { success: true, bookings: [] };
    }

    // Fetch all volunteers once for join
    const volunteersSnapshot = await db.collection('volunteers').get();
    const volunteersMap = new Map<string, any>();
    volunteersSnapshot.docs.forEach((doc: any) => {
      volunteersMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

    const bookings = snapshot.docs
      .map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          clientName: data.clientName,
          faculty: data.faculty,
          batch: data.batch,
          phone: data.phone,
          date: data.date,
          timeSlot: data.timeSlot,
          status: data.status || 'active',
          volunteerName: data.volunteerId ? (volunteersMap.get(data.volunteerId)?.name || 'Unknown') : 'Unknown',
          createdAt: data.createdAt,
        };
      })
      .sort((a: { date: string }, b: { date: string }) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0)); // newest first

    return { success: true, bookings };
  } catch (error) {
    console.error('getBookingsByPhone error:', error);
    return { success: false, error: 'An error occurred. Please try again.' };
  }
}

export async function cancelBookingByPhone(bookingId: string, phone: string) {
  if (!bookingId || !phone) {
    return { success: false, error: 'Invalid request.' };
  }

  const ip = await getClientIp();
  const rateLimit = await checkRateLimit('cancel_booking', ip, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { success: false, error: 'Too many cancellation requests. Please try again after 15 minutes.' };
  }

  try {
    const docRef = db.collection('bookings').doc(bookingId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { success: false, error: 'Booking not found.' };
    }

    const data = doc.data()!;
    // Verify the phone matches (identity check without real auth)
    if (data.phone !== phone.trim()) {
      return { success: false, error: 'Phone number does not match this booking.' };
    }

    if (data.status === 'cancelled') {
      return { success: false, error: 'This booking is already cancelled.' };
    }

    // Only allow cancellation for future bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(data.date);
    if (bookingDate < today) {
      return { success: false, error: 'Cannot cancel a past booking.' };
    }

    await docRef.update({ status: 'cancelled', cancelledAt: new Date().toISOString() });
    return { success: true };
  } catch (error) {
    console.error('cancelBookingByPhone error:', error);
    return { success: false, error: 'An error occurred. Please try again.' };
  }
}


export async function createVolunteerApplication(data: any) {
  try {
    const ip = await getClientIp();
    const rateLimit = await checkRateLimit('create_volunteer_application', ip, 3, 30 * 60 * 1000);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Too many application submissions. Please try again after 30 minutes.' };
    }

    const validated = applicantSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    // Check for duplicate application by email
    const emailQuery = await db.collection('volunteerApplicants')
      .where('email', '==', validated.data.email)
      .limit(1)
      .get();
    if (!emailQuery.empty) {
      return { success: false, error: "An application with this email has already been submitted." };
    }

    // Check for duplicate application by phone
    const phoneQuery = await db.collection('volunteerApplicants')
      .where('phone', '==', validated.data.phone)
      .limit(1)
      .get();
    if (!phoneQuery.empty) {
      return { success: false, error: "An application with this phone number has already been submitted." };
    }

    await db.collection('volunteerApplicants').doc().set({
      ...validated.data,
      createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error("Volunteer Application Error:", error);
    return { success: false, error: "Submission failed. Please try again later." };
  }
}


export async function createPerformanceRegistration(data: any) {
  try {
    const performanceSetting = await db.collection('systemSettings').doc('callForPerformance').get();
    if (performanceSetting.data()?.value !== 'true') {
      const messageSetting = await db.collection('systemSettings').doc('performanceRegistrationClosedMessage').get();
      return { success: false, error: messageSetting.data()?.value || 'Performance registration is currently closed.' };
    }

    const ip = await getClientIp();
    const rateLimit = await checkRateLimit('create_performance_registration', ip, 3, 30 * 60 * 1000);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Too many registration attempts. Please try again after 30 minutes.' };
    }

    const validated = performanceSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    if (validated.data.performanceType === "Other" && !validated.data.otherPerformanceType) {
      return { success: false, error: "Please specify your performance type." };
    }

    if (validated.data.type === "Group" && (!validated.data.groupMembers || validated.data.groupMembers.length === 0)) {
       return { success: false, error: "Please add at least one group member." };
    }

    await db.collection('performanceRegistrations').doc().set({
      ...validated.data,
      createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error("Performance Registration Error:", error);
    return { success: false, error: "Registration failed. Please try again later." };
  }
}
