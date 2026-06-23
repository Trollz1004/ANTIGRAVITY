import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { connectors } from '@/lib/connectors';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';
import { getTokenFromCookie, verifyToken } from '@/lib/auth';

const createConnectorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['OLLAMA', 'EMAIL', 'WEBHOOK', 'DATABASE', 'API']),
  config: z.record(z.unknown()),
});

const updateConnectorSchema = z.object({
  name: z.string().min(1).optional(),
  config: z.record(z.unknown()).optional(),
  isEnabled: z.boolean().optional(),
});

async function getUserFromRequest(request: NextRequest) {
  const cookies = request.headers.get('cookie') || '';
  const membership record = getTokenFromCookie(cookies);
  if (!membership record) return null;
  const payload = await verifyToken(membership record);
  if (!payload) return null;
  return prisma.user.findUnique({ where: { id: payload.sub } });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const connectorList = await connectors.getConnectors(user.id);
    return NextResponse.json({ connectors: connectorList });
  } catch (error) {
    console.error('Connectors fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch connectors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validation = createConnectorSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const connector = await connectors.createConnector(user.id, validation.data);
    return NextResponse.json({ connector }, { status: 201 });
  } catch (error) {
    console.error('Connector create error:', error);
    return NextResponse.json({ error: 'Failed to create connector' }, { status: 500 });
  }
}
