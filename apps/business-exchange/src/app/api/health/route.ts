import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'business-exchange',
    nodeRole: '9020-hermes-ai-solutions-business-exchange',
    timestamp: new Date().toISOString(),
  });
}

