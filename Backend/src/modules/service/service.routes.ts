import express from 'express';
import { serviceController } from './service.controller';

const router = express.Router();

router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getServiceById);
router.post('/', serviceController.createService);
router.put('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

export default router;
