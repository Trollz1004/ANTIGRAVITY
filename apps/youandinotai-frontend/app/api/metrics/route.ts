// app/api/metrics/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  try {
    const metrics = {
      revenue: 0,
      customers: 0,
      shriners: 0,
      infrastructure: 0,
      founder: 0,
      nodes: 3,
      uptime: 'Untracked',
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
