import { z } from 'zod';

export const createInvoiceSchema = z.object({
  clientId: z.string(),
  appointmentId: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  tax: z.number().min(0).default(0),
  paymentMethod: z.string().optional(),
  notes: z.string().optional()
});

export const updateInvoiceSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'CANCELLED', 'REFUNDED']).optional(),
  paymentMethod: z.string().optional(),
  paidAt: z.string().optional(),
  notes: z.string().optional()
});
