import { z } from 'zod';

export const createAppointmentSchema = z.object({
  clientId: z.string(),
  serviceId: z.string(),
  employeeId: z.string().optional(),
  startTime: z.string().datetime(),
  duration: z.number().int().positive(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional()
});

export const updateAppointmentSchema = createAppointmentSchema.partial().extend({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional()
});
