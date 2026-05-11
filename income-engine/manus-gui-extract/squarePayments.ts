import axios from "axios";

const SQUARE_BASE = process.env.SQUARE_API_BASE_URL || "https://connect.squareup.com";
const SQUARE_TOKEN = process.env.SQUARE_ACCESS_TOKEN || "";
const SQUARE_LOCATION = process.env.SQUARE_LOCATION_ID || "";
const SQUARE_VERSION = process.env.SQUARE_API_VERSION || "2026-01-22";

const sq = axios.create({
  baseURL: SQUARE_BASE,
  headers: {
    Authorization: `Bearer ${SQUARE_TOKEN}`,
    "Square-Version": SQUARE_VERSION,
    "Content-Type": "application/json",
  },
});

export type LeadTier = "bronze" | "silver" | "gold";

export const LEAD_TIERS = {
  bronze: { name: "Bronze Lead", price: 2500, description: "Raw qualified lead — title, source, URL, budget" },
  silver: { name: "Silver Lead", price: 7500, description: "Pre-qualified lead with budget analysis and deliverable breakdown" },
  gold:   { name: "Gold Lead",   price: 20000, description: "Fully qualified lead with AI-drafted outreach email ready to send" },
} as const;

export interface LeadPackage {
  tier: LeadTier;
  leadId: number;
  title: string;
  source: string;
  budget?: number;
  url: string;
  deliverable?: string;
  draftEmail?: string;
}

export async function createPaymentLink(pkg: LeadPackage): Promise<{ url: string; orderId: string }> {
  const tier = LEAD_TIERS[pkg.tier];
  const idempotencyKey = `lead-${pkg.leadId}-${pkg.tier}-${Date.now()}`;

  const body = {
    idempotency_key: idempotencyKey,
    quick_pay: {
      name: `${tier.name}: ${pkg.title.substring(0, 60)}`,
      price_money: { amount: tier.price, currency: "USD" },
      location_id: SQUARE_LOCATION,
    },
    description: tier.description,
  };

  const res = await sq.post("/v2/online-checkout/payment-links", body);
  return {
    url: res.data.payment_link.url,
    orderId: res.data.payment_link.order_id,
  };
}

export async function listOrders(limit = 20): Promise<any[]> {
  const res = await sq.post("/v2/orders/search", {
    location_ids: [SQUARE_LOCATION],
    query: { sort: { sort_field: "CREATED_AT", sort_order: "DESC" } },
    limit,
  });
  return res.data.orders || [];
}

export async function getPaymentStatus(orderId: string): Promise<string> {
  const res = await sq.get(`/v2/orders/${orderId}`);
  return res.data.order?.state || "UNKNOWN";
}
