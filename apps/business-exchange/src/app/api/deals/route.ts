import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';
import { getTokenFromCookie, verifyToken } from '@/lib/auth';
import { Prisma } from '@prisma/client';

const dealSchema = z.object({
  listingId: z.string(),
  terms: z.record(z.unknown()).optional(),
});

const updateDealSchema = z.object({
  status: z.enum(['NEGOTIATION', 'CONTRACT_SIGNED', 'COMPLETED', 'ARCHIVED']).optional(),
  agreedPrice: z.number().positive().optional(),
  terms: z.record(z.unknown()).optional(),
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get user's orgs
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id },
      select: { organizationId: true },
    });
    const orgIds = memberships.map(m => m.organizationId);

    const where: Record<string, unknown> = {
      OR: [
        { buyerOrgId: { in: orgIds } },
        { sellerOrgId: { in: orgIds } },
      ],
    };
    if (status) where.status = status;

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          listing: { select: { id: true, title: true, type: true } },
          buyerOrg: { select: { id: true, name: true } },
          sellerOrg: { select: { id: true, name: true } },
        },
      }),
      prisma.deal.count({ where }),
    ]);

    return NextResponse.json({
      deals,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Deals fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validation = dealSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: validation.data.listingId },
      include: { org: true },
    });
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Get buyer org (user's org)
    const buyerMembership = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      select: { organizationId: true },
    });
    if (!buyerMembership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Can't deal with yourself
    if (listing.orgId === buyerMembership.organizationId) {
      return NextResponse.json({ error: 'Cannot initiate deal on own listing' }, { status: 400 });
    }

    const deal = await prisma.deal.create({
      data: {
        listingId: listing.id,
        buyerOrgId: buyerMembership.organizationId,
        sellerOrgId: listing.orgId,
        status: 'NEGOTIATION',
        terms: validation.data.terms as unknown as Prisma.InputJsonValue,
      },
      include: {
        listing: { select: { id: true, title: true, type: true } },
        buyerOrg: { select: { id: true, name: true } },
        sellerOrg: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: 'DEAL_CREATED',
      entity: 'deal',
      entityId: deal.id,
      newData: { listingId: listing.id, buyerOrgId: deal.buyerOrgId, sellerOrgId: deal.sellerOrgId },
    });

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error('Deal create error:', error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}
