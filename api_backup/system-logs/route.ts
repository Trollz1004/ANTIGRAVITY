import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    logs: ['[INFO] Internal task logs and node diagnostics are intentionally withheld from the public dashboard.'],
  });
}
