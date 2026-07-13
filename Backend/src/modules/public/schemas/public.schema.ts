import { z } from 'zod';

export const createPublicReviewSchema = z.object({
  tenantId: z.string(),
  appointmentId: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional()
});

export const createPublicFamilyMemberSchema = z.object({
  clientEmail: z.string().email('Client email is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional().or(z.literal('')), // Optional - some people only have one name
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  relationship: z.string().min(1, 'Relationship is required'),
  avatar: z.string().optional()
});

export const updatePublicFamilyMemberSchema = z.object({
  clientEmail: z.string().email('Client email is required'),
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional().or(z.literal('')), // Optional - some people only have one name
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  relationship: z.string().min(1).optional(),
  avatar: z.string().optional()
});

export const bookingParticipantSchema = z.object({
  name: z.string().min(1, 'Participant name is required'),
  clientId: z.string().optional(),
  sameServicesAsBooker: z.boolean().optional(),
  serviceIds: z.array(z.string()).optional(),
});

export const createPublicBookingSchema = z.object({
  tenantId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  serviceIds: z.array(z.string()).min(1),
  startTime: z.string().min(1),
  notes: z.string().optional(),
  /** When false, booker is contact only — appointments only for participants. */
  includeBooker: z.boolean().optional().default(true),
  participants: z.array(bookingParticipantSchema).optional(),
});
