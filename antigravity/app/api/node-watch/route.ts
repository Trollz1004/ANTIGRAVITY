import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

type ServiceState = 'live' | 'degraded' | 'down';

type ServiceCard = {
  name: string;
  status: ServiceState;
  detail: string;
  meta?: string[];
};

const PUBLIC_SURFACES = [
  { name: 'YouAndINotAI', url: 'https://youandinotai.com' },
  { name: 'OnlineRecycle', url: 'https://onlinerecycle.org' },
  { name: 'AI-Solutions Store', url: 'https://ai-solutions.store' },
  { name: 'Antigravity Dashboard', url: 'https://dashboard.aidoesitall.website' },
] as const;

async function checkSurface(surface: (typeof PUBLIC_SURFACES)[number]): Promise<ServiceCard> {
  try {
    const response = await fetch(surface.url, { cache: 'no-store' });
    return {
      name: surface.name,
      status: response.ok ? 'live' : 'degraded',
      detail: response.ok ? 'Public surface responded.' : `Public surface returned HTTP ${response.status}.`,
      meta: [surface.url],
    };
  } catch {
    return {
      name: surface.name,
      status: 'down',
      detail: 'Public surface did not respond during this check.',
      meta: [surface.url],
    };
  }
}

export async function GET() {
  const cards = await Promise.all(PUBLIC_SURFACES.map(checkSurface));
  const liveCount = cards.filter((card) => card.status === 'live').length;

  return NextResponse.json({
    cards,
    summary: {
      liveCount,
      total: cards.length,
      status: liveCount === cards.length ? 'green' : liveCount > 0 ? 'mostly-green' : 'attention',
      lastUpdated: new Date().toISOString(),
    },
  });
}
