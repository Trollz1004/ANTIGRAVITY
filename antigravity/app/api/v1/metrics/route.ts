// app/api/v1/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface WebVitalsPayload {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: string;
  navigationType?: string;
  url?: string;
  timestamp?: number;
}

// Performance budgets for server-side validation
const PERFORMANCE_BUDGETS: Record<string, number> = {
  LCP: 2500,
  CLS: 0.1,
  FID: 100,
  INP: 200,
  TTFB: 800,
  FCP: 1800,
};

export async function POST(request: NextRequest) {
  try {
    const body: WebVitalsPayload = await request.json();

    const { name, value, rating, url, timestamp } = body;

    if (!name || typeof value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid payload: name and value are required' },
        { status: 400 }
      );
    }

    const budget = PERFORMANCE_BUDGETS[name];
    const budgetExceeded = budget ? value > budget : false;

    // Log the metric (in production, this would go to a time-series DB or analytics service)
    console.log('[Web Vitals RUM]', JSON.stringify({
      name,
      value: Math.round(value * 100) / 100,
      rating,
      url,
      timestamp: timestamp || Date.now(),
      budget,
      budgetExceeded,
    }));

    // Warn if budget exceeded
    if (budgetExceeded) {
      console.warn(
        `[Web Vitals] ⚠️ ${name} budget exceeded: ${value.toFixed(2)} (budget: ${budget}) from ${url}`
      );
    }

    return NextResponse.json({ success: true, budgetExceeded });
  } catch (error) {
    console.error('[Web Vitals] Failed to process metric:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Health check / GET handler
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/v1/metrics',
    budgets: PERFORMANCE_BUDGETS,
  });
}
