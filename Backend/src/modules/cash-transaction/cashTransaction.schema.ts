import { z } from 'zod';

export const createCashTransactionSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CHECK', 'ONLINE']),
  notes: z.string().optional()
});

export type CreateCashTransactionInput = z.infer<typeof createCashTransactionSchema>;
