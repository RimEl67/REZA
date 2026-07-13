import { z } from 'zod';

export const createFamilyMemberSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  relationship: z.string().min(1, 'Relationship is required'),
  avatar: z.string().optional()
});

export const updateFamilyMemberSchema = createFamilyMemberSchema.partial();
