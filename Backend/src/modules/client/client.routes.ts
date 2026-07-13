import express from 'express';
import { clientController } from './client.controller';

const router = express.Router();

router.get('/', clientController.getClients);
router.get('/duplicates', clientController.detectDuplicates);
router.post('/merge', clientController.mergeClients);
router.get('/:id', clientController.getClientById);
router.post('/', clientController.createClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

export default router;
