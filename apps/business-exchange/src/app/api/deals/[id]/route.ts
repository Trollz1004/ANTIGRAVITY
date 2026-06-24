import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';
import { getTokenFromCookie, verifyToken } from '@/lib/auth';
import { Prisma } from '@prisma/client';

const updateDealSchema = z.object({
  status: z.enum(['NEGOTIATION', 'CONTRACT_SIGNED', 'COMPLETED', 'ARCHIVED']).optional(),
  agreedPrice: z.number().positive().optional(),
  terms: z.record(z.unknown()).optional(),
});

async function getUserFromRequest(request: NextRequest) {
  const cookies = request.headers.get('cookie') || '';
  const token = getTokenFromCookie(cookies);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return prisma.user.findUnique({ where: { id: payload.sub } });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, title: true, type: true, orgId: true } },
        buyerOrg: { select: { id: true, name: true } },
        sellerOrg: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Check access
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id },
      select: { organizationId: true },
    });
    const orgIds = memberships.map((membership: { organizationId: string }) => membership.organizationId);
    if (!orgIds.includes(deal.buyerOrgId) && !orgIds.includes(deal.sellerOrgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error('Deal fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const deal = await prisma.deal.findUnique({ where: { id } });
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id },
      select: { organizationId: true, role: true },
    });
    const orgIds = memberships.map((membership: { organizationId: string }) => membership.organizationId);
    const isBuyer = orgIds.includes(deal.buyerOrgId);
    const isSeller = orgIds.includes(deal.sellerOrgId);
    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateDealSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const oldStatus = deal.status;
    const updateData: Prisma.DealUpdateInput = {
      status: validation.data.status,
      agreedPrice: validation.data.agreedPrice,
      terms: validation.data.terms as unknown as Prisma.InputJsonValue,
      completedAt: validation.data.status === 'COMPLETED' ? new Date() : undefined,
    };

    const updated = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        listing: { select: { id: true, title: true, type: true } },
        buyerOrg: { select: { id: true, name: true } },
        sellerOrg: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: 'DEAL_UPDATED',
      entity: 'deal',
      entityId: id,
      oldData: { status: oldStatus, agreedPrice: deal.agreedPrice },
      newData: { status: updated.status, agreedPrice: updated.agreedPrice },
    });

    return NextResponse.json({ deal: updated });
  } catch (error) {
    console.error('Deal update error:', error);
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
  }
}
