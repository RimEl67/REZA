import express from 'express';
import { requireRole } from '../../middleware/authenticateRequest';
import { cashTransactionController } from './cashTransaction.controller';

const router = express.Router();

/**
 * GET /api/cash-transactions
 * Get all cash transactions for the tenant
 */
router.get('/', (req, res, next) => cashTransactionController.getTransactions(req, res, next));

/**
 * GET /api/cash-transactions/:id
 * Get a specific cash transaction
 */
router.get('/:id', (req, res, next) => cashTransactionController.getTransactionById(req, res, next));

/**
 * POST /api/cash-transactions
 * Create a new cash transaction
 */
router.post('/', requireRole('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'), (req, res, next) =>
  cashTransactionController.createTransaction(req, res, next)
);

/**
 * DELETE /api/cash-transactions/:id
 * Delete a cash transaction
 */
router.delete('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), (req, res, next) =>
  cashTransactionController.deleteTransaction(req, res, next)
);

export default router;
