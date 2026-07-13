import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { invoiceService } from './invoice.service';
import { createInvoiceSchema, updateInvoiceSchema } from './invoice.schema';

export class InvoiceController {
  async getInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query;
      const invoices = await invoiceService.getInvoices(req.tenantId!, status as string);
      res.json({ invoices });
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.getInvoiceById(req.tenantId!, req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      res.json({ invoice });
    } catch (error) {
      next(error);
    }
  }

  async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createInvoiceSchema.parse(req.body);
      const invoice = await invoiceService.createInvoice(req.tenantId!, data);
      res.status(201).json({ invoice });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', message: error.errors[0].message });
      }
      if (error.message === 'CLIENT_NOT_FOUND') {
        return res.status(404).json({ error: 'Client not found' });
      }
      if (error.message === 'APPOINTMENT_NOT_FOUND') {
        return res.status(404).json({
          error: 'Appointment not found',
          message: 'The specified appointment does not exist or does not belong to your establishment.'
        });
      }
      if (error.message === 'CLIENT_MISMATCH') {
        return res.status(400).json({
          error: 'Client mismatch',
          message: 'The specified appointment does not belong to the selected client.'
        });
      }
      next(error);
    }
  }

  async updateInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateInvoiceSchema.parse(req.body);
      const invoice = await invoiceService.updateInvoice(req.tenantId!, req.params.id, data);
      res.json({ invoice });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', message: error.errors[0].message });
      }
      if (error.message === 'INVOICE_NOT_FOUND') {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await invoiceService.getStats(req.tenantId!);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

export const invoiceController = new InvoiceController();
