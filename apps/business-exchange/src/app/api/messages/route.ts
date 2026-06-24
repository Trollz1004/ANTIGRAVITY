import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';
import { getTokenFromCookie, verifyToken } from '@/lib/auth';
import { Prisma } from '@prisma/client';

const messageSchema = z.object({
  dealId: z.string(),
  content: z.string().min(1, 'Message cannot be empty'),
  metadata: z.record(z.unknown()).optional(),
});

async function getUserFromRequest(request: NextRequest) {
  const cookies = request.headers.get('cookie') || '';
  const token = getTokenFromCookie(cookies);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return prisma.user.findUnique({ where: { id: payload.sub } });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!dealId) {
      return NextResponse.json({ error: 'dealId required' }, { status: 400 });
    }

    // Verify access to deal
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id },
      select: { organizationId: true },
    });
    const orgIds = memberships.map((membership: { organizationId: string }) => membership.organizationId);
    if (!orgIds.includes(deal.buyerOrgId) && !orgIds.includes(deal.sellerOrgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { dealId },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({ where: { dealId } }),
    ]);

    return NextResponse.json({
      messages,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Messages fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validation = messageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const deal = await prisma.deal.findUnique({ where: { id: validation.data.dealId } });
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id },
      select: { organizationId: true },
    });
    const orgIds = memberships.map((membership: { organizationId: string }) => membership.organizationId);
    if (!orgIds.includes(deal.buyerOrgId) && !orgIds.includes(deal.sellerOrgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        dealId: validation.data.dealId,
        senderId: user.id,
        content: validation.data.content,
        metadata: validation.data.metadata as unknown as Prisma.InputJsonValue,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: 'MESSAGE_SENT',
      entity: 'message',
      entityId: message.id,
      newData: { dealId: message.dealId },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Message create error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
