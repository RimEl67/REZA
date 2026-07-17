import { z } from 'zod';

const createAppointmentSchemaBase = z.object({
  clientId: z.string(),
  serviceId: z.string().optional(),
  serviceIds: z.array(z.string()).min(1).optional(),
  services: z.array(z.object({ serviceId: z.string() })).min(1).optional(),
  employeeId: z.string().optional(),
  startTime: z.string().datetime(),
  duration: z.number().int().positive().optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
});

export const createAppointmentSchema = createAppointmentSchemaBase.refine((data) => data.serviceId || data.serviceIds?.length || data.services?.length, {
  message: 'At least one service is required',
  path: ['serviceIds'],
});

export const updateAppointmentSchema = createAppointmentSchemaBase.partial().extend({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
});
