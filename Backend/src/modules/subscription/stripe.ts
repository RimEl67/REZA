import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

/** Lazily create the Stripe client (test mode in dev). */
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw {
        status: 500,
        error: 'Stripe not configured',
        message: 'STRIPE_SECRET_KEY is not set on the server',
      };
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}
