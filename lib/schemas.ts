/**
 * lib/schemas.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all Zod validation schemas.
 * Imported by BOTH server actions (app/actions/*.ts) and client components
 * (components/client/*.tsx) so they can never drift out of sync.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Accepts digits, spaces, +, -, ( and ) — standard phone formats, 10–15 chars */
export const PHONE_REGEX = /^[0-9+\-()\s]{10,15}$/;

/** Only allows college emails ending with @acem.edu.np */
export const COLLEGE_EMAIL_DOMAIN = '@acem.edu.np';

/** Name must contain only letters, spaces, dots, and hyphens */
export const NAME_REGEX = /^[a-zA-Z\s.\-']+$/;

export const phoneField = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number is too long')
  .regex(PHONE_REGEX, 'Phone must contain only digits, spaces, +, -, or ()');

export const collegeEmailField = z
  .string()
  .email('Invalid email address')
  .max(254, 'Email is too long')
  .refine((email) => email.toLowerCase().endsWith(COLLEGE_EMAIL_DOMAIN), {
    message: 'Email must end with @acem.edu.np',
  });

export const nameField = z
  .string()
  .min(2, 'Name is too short')
  .max(100, 'Name is too long')
  .regex(NAME_REGEX, 'Name can only contain letters, spaces, dots, and hyphens');

export const FACULTY_VALUES = ['BEI', 'BEL', 'BCT', 'BCE', 'BCA'] as const;
export type Faculty = (typeof FACULTY_VALUES)[number];

// ---------------------------------------------------------------------------
// Booking schema (used in BookingForm & createBooking action)
// ---------------------------------------------------------------------------
export const bookingSchema = z.object({
  clientName: nameField,
  phone: phoneField,
  faculty: z.enum(FACULTY_VALUES),
  batch: z.string().min(1, 'Batch is required').max(20, 'Batch is too long'),
  date: z.string().min(1, 'Date is required'),
  timeSlot: z.string().min(1, 'Time slot is required').max(20, 'Invalid time slot'),
  volunteerId: z.string().min(1, 'Volunteer is required').max(128, 'Invalid volunteer ID'),
});

export type BookingData = z.infer<typeof bookingSchema>;

// ---------------------------------------------------------------------------
// Volunteer applicant schema (used in ApplicationForm & createVolunteerApplication)
// ---------------------------------------------------------------------------
export const applicantSchema = z.object({
  name: nameField,
  faculty: z.enum(FACULTY_VALUES),
  phone: phoneField,
  email: collegeEmailField,
});

export type ApplicantData = z.infer<typeof applicantSchema>;

// ---------------------------------------------------------------------------
// Performance registration schema (used in PerformanceForm & createPerformanceRegistration)
// ---------------------------------------------------------------------------
export const performanceSchema = z.object({
  name: nameField,
  phone: phoneField,
  collegeMail: collegeEmailField,
  performanceType: z.enum(['Dance', 'Singing', 'Poem', 'Standup', 'Drama', 'Band', 'Other']),
  otherPerformanceType: z
    .string()
    .max(100, 'Performance type description is too long')
    .optional(),
  type: z.enum(['Solo', 'Group']),
  groupName: z.string().max(100, 'Group name is too long').optional(),
  materialRequired: z
    .string()
    .max(500, 'Material description is too long (max 500 characters)')
    .optional(),
  groupMembers: z
    .array(
      z.object({
        name: z.string().min(2, 'Member name is required').max(100, 'Member name is too long')
          .regex(NAME_REGEX, 'Name can only contain letters, spaces, dots, and hyphens'),
        phone: phoneField,
      })
    )
    .max(20, 'A group cannot have more than 20 members')
    .optional(),
});

export type PerformanceData = z.infer<typeof performanceSchema>;
