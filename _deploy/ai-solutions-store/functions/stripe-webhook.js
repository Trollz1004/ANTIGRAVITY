/**
 * Cloudflare Pages Function: /stripe-webhook
 * Stripe webhook receiver for ai-solutions.store
 * Requires env.STRIPE_WEBHOOK_SECRET
 * Optional: env.ORDERS (KV namespace) for persistence
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function verifyStripeSignature(payload, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = signature.split(",").find((p) => p.startsWith("v1="))?.split("=")[1];
  if (!sig) return false;
  const expected = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === sig;
}

export async function onRequestPost(context) {
  const secret = context.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return json({ error: "webhook_secret_missing" }, 500);
  }

  const signature = context.request.headers.get("stripe-signature");
  if (!signature) return json({ error: "missing_signature" }, 400);

  const payload = await context.request.text();

  const valid = await verifyStripeSignature(payload, signature, secret);
  if (!valid) return json({ error: "invalid_signature" }, 400);

  let event;
  try {
    event = JSON.parse(payload);
  } catch (_) {
    return json({ error: "invalid_json" }, 400);
  }

  const { type, data } = event;
  console.log(`stripe webhook received: ${type}`);

  const kv = context.env.ORDERS; // optional KV binding

  try {
    if (type === "checkout.session.completed") {
      const session = data.object;
      const order = {
        id: session.id,
        amount: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_details?.email || session.customer_email,
        sku: session.metadata?.sku || "unknown",
        status: "paid",
        created_at: new Date().toISOString(),
      };
      if (kv) await kv.put(`order:${session.id}`, JSON.stringify(order));
      console.log("order persisted", order);
    } else if (type === "payment_intent.succeeded") {
      const pi = data.object;
      if (kv) await kv.put(`payment:${pi.id}`, JSON.stringify({ id: pi.id, status: "succeeded", amount: pi.amount }));
    } else if (type === "charge.refunded") {
      const charge = data.object;
      if (kv) await kv.put(`refund:${charge.id}`, JSON.stringify({ id: charge.id, status: "refunded" }));
    }
  } catch (err) {
    console.error("storage error", String(err));
  }

  return json({ received: true, type });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
