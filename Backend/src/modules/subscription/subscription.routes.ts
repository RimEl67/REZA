import express from 'express';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/authenticateRequest';
import { subscriptionService } from './subscription.service';

const router = express.Router();

/**
 * GET /api/subscription
 * Current subscription + plan + salon limit for the owner's account.
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const result = await subscriptionService.getForUser(req.userId!);
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ error: error.error, message: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/subscription/checkout
 * Create a Stripe Checkout session (test mode) and return its URL.
 */
router.post('/checkout', authMiddleware, async (req, res, next) => {
  try {
    const schema = z.object({ planId: z.string().optional() });
    const { planId } = schema.parse(req.body ?? {});
    const result = await subscriptionService.createCheckout(req.userId!, planId);
    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', message: error.errors[0].message });
    }
    if (error.status) {
      return res.status(error.status).json({ error: error.error, message: error.message });
    }
    next(error);
  }
});

export default router;
