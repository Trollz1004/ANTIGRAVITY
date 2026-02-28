/**
 * Stripe API client — reads from Stripe REST API using secret key from env.
 * No Stripe SDK dependency. Raw axios calls for minimal footprint.
 */

// @ts-ignore - axios types
import axios from "axios";
import type { AxiosError } from "axios";

const STRIPE_BASE = "https://api.stripe.com/v1";

function getStripeKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set in environment");
  return key;
}

function stripeHeaders() {
  return {
    Authorization: `Bearer ${getStripeKey()}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

export interface StripeBalance {
  available: number;
  pending: number;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  customer: string | null;
  receipt_email: string | null;
  description: string | null;
}

export interface StripeCustomer {
  id: string;
  email: string | null;
  name: string | null;
  created: number;
}

export interface StripeSubscription {
  id: string;
  status: string;
  customer: string;
  current_period_start: number;
  current_period_end: number;
  plan_amount: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getBalance(): Promise<StripeBalance> {
  const res = await axios.get<any>(`${STRIPE_BASE}/balance`, { headers: stripeHeaders() });
  const available = res.data.available.reduce((sum: number, b: { amount: number }) => sum + b.amount, 0);
  const pending = res.data.pending.reduce((sum: number, b: { amount: number }) => sum + b.amount, 0);
  return { available, pending };
}

export async function listPaymentIntents(limit = 25, status?: string): Promise<StripePaymentIntent[]> {
  const params: Record<string, string | number> = { limit };
  if (status) params.status = status;
  const res = await axios.get<any>(`${STRIPE_BASE}/payment_intents`, { headers: stripeHeaders(), params });
  return res.data.data.map((pi: Record<string, unknown>) => ({
    id: pi.id,
    amount: pi.amount,
    currency: pi.currency,
    status: pi.status,
    created: pi.created,
    customer: pi.customer ?? null,
    receipt_email: pi.receipt_email ?? null,
    description: pi.description ?? null,
  }));
}

export async function listCustomers(limit = 25): Promise<StripeCustomer[]> {
  const res = await axios.get<any>(`${STRIPE_BASE}/customers`, { headers: stripeHeaders(), params: { limit } });
  return res.data.data.map((c: Record<string, unknown>) => ({
    id: c.id,
    email: c.email ?? null,
    name: c.name ?? null,
    created: c.created,
  }));
}

export async function listSubscriptions(limit = 25, status = "all"): Promise<StripeSubscription[]> {
  const res = await axios.get<any>(`${STRIPE_BASE}/subscriptions`, {
    headers: stripeHeaders(),
    params: { limit, status },
  });
  return res.data.data.map((s: Record<string, unknown>) => ({
    id: s.id,
    status: s.status,
    customer: s.customer,
    current_period_start: (s as Record<string, number>).current_period_start,
    current_period_end: (s as Record<string, number>).current_period_end,
    plan_amount: ((s as Record<string, Record<string, Record<string, number>>>).plan?.amount) ?? 0,
  }));
}

export async function getRevenueSnapshot(): Promise<{
  balance: StripeBalance;
  totalRevenue: number;
  customerCount: number;
  verifications: number;
  subscriptions: number;
  recentPayments: StripePaymentIntent[];
}> {
  const [balance, payments, customers, subs] = await Promise.all([
    getBalance(),
    listPaymentIntents(100, "succeeded"),
    listCustomers(100),
    listSubscriptions(100, "active"),
  ]);

  const totalRevenue = payments.reduce((sum, pi) => sum + pi.amount, 0) / 100;
  const verifications = payments.filter((pi) => pi.amount === 100).length; // $1.00 = 100 cents
  const recentPayments = payments.slice(0, 10);

  return {
    balance,
    totalRevenue,
    customerCount: customers.length,
    verifications,
    subscriptions: subs.length,
    recentPayments,
  };
}

export function handleStripeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axErr = error as { response?: { status: number; data?: { error?: { message?: string } } }; code?: string };
    if (axErr.response) {
      const msg = axErr.response.data?.error?.message;
      switch (axErr.response.status) {
        case 401: return "Error: Invalid Stripe API key. Check STRIPE_SECRET_KEY in .env";
        case 429: return "Error: Stripe rate limit. Wait 1 minute and retry.";
        default: return `Stripe error ${axErr.response.status}: ${msg ?? "Unknown"}`;
      }
    }
    if (axErr.code === "ECONNABORTED") return "Error: Stripe request timed out.";
  }
  return `Stripe error: ${error instanceof Error ? error.message : String(error)}`;
}
