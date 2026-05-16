'use server';

import { db } from '@/lib/firebase';
import { z } from 'zod';

const DEFAULT_TIME_SLOTS = ['2:30-3:30', '3:30-4:30', '4:30-5:30'];

const bookingSchema = z.object({
  clientName: z.string().min(2, "Name is too short"),
  phone: z.string().min(10, "Invalid phone number"),
  faculty: z.enum(["BEI", "BEL", "BCT", "BCE", "BCA"]),
  batch: z.string().min(1, "Batch is required"),
  date: z.string().min(1, "Date is required"),
  timeSlot: z.string().min(1, "Time slot is required"),
  volunteerId: z.string().min(1, "Volunteer is required"),
});

type BookingData = z.infer<typeof bookingSchema>;

export async function createBooking(data: BookingData) {
  try {
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

    // 4. Server-side Availability Check (Prevent race conditions)
    // Run an atomic transaction for bookings to prevent race conditions
    const bookingRef = db.collection('bookings').doc();
    const isSuccess = await db.runTransaction(async (transaction: any) => {
      const existingQuery = await transaction.get(
        db.collection('bookings')
          .where('date', '==', data.date)
          .where('timeSlot', '==', data.timeSlot)
          .where('volunteerId', '==', data.volunteerId)
      );

      // Filter in-code: a slot is blocked only if an active (non-cancelled) booking exists
      // This also handles old bookings that pre-date the status field (treated as active)
      const hasActiveBooking = !existingQuery.empty &&
        existingQuery.docs.some((doc: any) => (doc.data().status || 'active') !== 'cancelled');

      if (hasActiveBooking) {
        return false; // Already booked
      }

      transaction.set(bookingRef, {
        ...validated.data,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      return true;
    });

    if (!isSuccess) {
      return { success: false, error: "This slot has already been taken. Please choose another one." };
    }

    return { success: true, bookingId: bookingRef.id };

  } catch (error) {
    console.error("Create Booking Error:", error);
    return { success: false, error: "An internal server error occurred." };
  }
}

export async function getBookings() {
  const snapshot = await db.collection('bookings').get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
}

export async function getPublicVolunteers() {
  const snapshot = await db.collection('volunteers').orderBy('name', 'asc').get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
}

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

export async function getBookingsByPhone(phone: string) {
  if (!phone || phone.trim().length < 7) {
    return { success: false, error: 'Please enter a valid phone number.' };
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

const applicantSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  faculty: z.enum(["BEI", "BEL", "BCT", "BCE", "BCA"]),
  phone: z.string().min(10, "Invalid phone number"),
  email: z.string().email("Invalid email address"),
});

export async function createVolunteerApplication(data: any) {
  try {
    const validated = applicantSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
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

const performanceSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  phone: z.string().min(10, "Invalid phone number"),
  collegeMail: z.string().email("Invalid email address"),
  performanceType: z.enum(["Dance", "Singing", "Poem", "Standup", "Drama", "Other"]),
  otherPerformanceType: z.string().optional(),
  type: z.enum(["Solo", "Group"]),
  groupMembers: z.array(z.object({
    name: z.string().min(2, "Name is required"),
    phone: z.string().min(10, "Phone is required")
  })).optional()
});

export async function createPerformanceRegistration(data: any) {
  try {
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
