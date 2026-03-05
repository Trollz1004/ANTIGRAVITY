import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-01-27-acacia' as any, // Use the latest stable version
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Protocol Omega Revenue Split Logic (60/30/10)
 * 60% -> Shriners Children's Hospitals
 * 30% -> V8 Verification Engine / AI Infrastructure
 * 10% -> Founder Operations (Joshua Coleman)
 */
function calculateSplit(amountInCents: number) {
  const shriners = Math.floor(amountInCents * 0.60);
  const infrastructure = Math.floor(amountInCents * 0.30);
  const founder = amountInCents - shriners - infrastructure; // Ensures no rounding loss

  return {
    shriners: shriners / 100,
    infrastructure: infrastructure / 100,
    founder: founder / 100,
    total: amountInCents / 100,
  };
}

export async function POST(req: NextRequest) {
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

        // TODO: Store this transaction in the database (PostgreSQL via Prisma/Drizzle)
        // TODO: Trigger on-chain split via Protocol Omega smart contract (Base Mainnet)
      }
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // Handle direct payment intents if necessary
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
