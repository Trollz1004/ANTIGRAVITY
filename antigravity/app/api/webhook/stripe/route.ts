import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Initialize Stripe inside the handler to ensure it only runs when needed
  // and has access to environment variables at runtime.
  const stripeSecret = process.env.STRIPE_SECRET_KEY as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: '2025-01-27-acacia' as any,
  });

  const payload = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
      throw new Error('Missing stripe-signature or STRIPE_WEBHOOK_SECRET');
    }
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  /**
   * Protocol Omega Revenue Split Logic (60/30/10)
   */
  const calculateSplit = (amountInCents: number) => {
    const shriners = Math.floor(amountInCents * 0.60);
    const infrastructure = Math.floor(amountInCents * 0.30);
    const founder = amountInCents - shriners - infrastructure;

    return {
      shriners: shriners / 100,
      infrastructure: infrastructure / 100,
      founder: founder / 100,
      total: amountInCents / 100,
    };
  };

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const amount = session.amount_total;

      if (amount) {
        const split = calculateSplit(amount);
        console.log('💰 Revenue Received:', split.total);
        console.log('🎁 Shriners Share (60%):', split.shriners);
        console.log('⚙️ Infrastructure Share (30%):', split.infrastructure);
        console.log('👤 Founder Share (10%):', split.founder);

        // TODO: Store this transaction in the database
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
