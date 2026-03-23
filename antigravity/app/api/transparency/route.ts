import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    wallets: [],
    contractTxCount: 0,
    contractVerified: false,
    network: 'Public dashboard scope only',
    lastUpdated: new Date().toISOString(),
    note: 'Detailed wallet addresses and unfinished payment-proof flows are intentionally omitted from the public dashboard.',
  });
}
