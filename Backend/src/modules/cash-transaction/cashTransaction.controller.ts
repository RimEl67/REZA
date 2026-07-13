import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { cashTransactionService } from './cashTransaction.service';
import { createCashTransactionSchema } from './cashTransaction.schema';

export class CashTransactionController {
  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, type, page = '1', limit = '100' } = req.query;
      const result = await cashTransactionService.getTransactions(
        req.tenantId!,
        startDate as string,
        endDate as string,
        type as string,
        parseInt(page as string),
        parseInt(limit as string)
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getTransactionById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cashTransactionService.getTransactionById(req.tenantId!, req.params.id);
      res.json(result);
    } catch (error: any) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error });
      }
      next(error);
    }
  }

  async createTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCashTransactionSchema.parse(req.body);
      const result = await cashTransactionService.createTransaction(req.tenantId!, req.userId!, data);
      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          message: error.errors[0].message
        });
      }
      next(error);
    }
  }

  async deleteTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cashTransactionService.deleteTransaction(req.tenantId!, req.params.id);
      res.json(result);
    } catch (error: any) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error });
      }
      next(error);
    }
  }
}

export const cashTransactionController = new CashTransactionController();
