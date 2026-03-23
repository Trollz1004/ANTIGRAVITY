import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Public configuration writes are disabled. Use private internal tooling for credential and environment changes.',
    },
    { status: 403 },
  );
}
