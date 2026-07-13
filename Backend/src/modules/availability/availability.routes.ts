import express from 'express';
import { availabilityController } from './availability.controller';

const router = express.Router();

router.get('/stream', availabilityController.stream);

export default router;
