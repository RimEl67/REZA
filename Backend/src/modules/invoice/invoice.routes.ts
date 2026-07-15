import express from 'express';
import { invoiceController } from './invoice.controller';

const router = express.Router();

router.get('/stats', invoiceController.getStats);
router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.post('/sale', invoiceController.createSale);
router.post('/', invoiceController.createInvoice);
router.put('/:id', invoiceController.updateInvoice);
router.patch('/:id', invoiceController.updateInvoice);

export default router;
