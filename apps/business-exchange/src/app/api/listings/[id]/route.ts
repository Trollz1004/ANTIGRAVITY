import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';
import { getTokenFromCookie, verifyToken } from '@/lib/auth';
import { Prisma } from '@prisma/client';

const updateListingSchema = z.object({
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(20).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SOLD']).optional(),
  pricing: z.object({
    model: z.enum(['FIXED', 'RANGE', 'AUCTION', 'LOI_ONLY']),
    amount: z.number().positive().optional(),
    minAmount: z.number().positive().optional(),
    maxAmount: z.number().positive().optional(),
    currency: z.string().default('USD'),
  }).optional(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        org: { select: { id: true, name: true, slug: true, type: true, metadata: true } },
        deals: {
          where: { status: { in: ['NEGOTIATION', 'CONTRACT_SIGNED'] } },
          select: { id: true, status: true, buyerOrgId: true, agreedPrice: true },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json({ listing });
  } catch (error) {
    console.error('Listing fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
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
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Check ownership
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, organizationId: listing.orgId, role: { in: ['OWNER', 'ADMIN'] } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateListingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const oldData = { ...listing };
    const updateData: Prisma.ListingUpdateInput = {
      title: validation.data.title,
      description: validation.data.description,
      status: validation.data.status,
      pricing: validation.data.pricing as unknown as Prisma.InputJsonValue,
      metadata: validation.data.metadata as unknown as Prisma.InputJsonValue,
    };

    const updated = await prisma.listing.update({
      where: { id },
      data: updateData,
      include: { org: { select: { id: true, name: true, slug: true } } },
    });

    await createAuditLog({
      userId: user.id,
      action: 'LISTING_UPDATED',
      entity: 'listing',
      entityId: id,
      oldData: { title: oldData.title, status: oldData.status },
      newData: { title: updated.title, status: updated.status },
    });

    return NextResponse.json({ listing: updated });
  } catch (error) {
    console.error('Listing update error:', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id, organizationId: listing.orgId, role: 'OWNER' },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.listing.delete({ where: { id } });

    await createAuditLog({
      userId: user.id,
      action: 'LISTING_DELETED',
      entity: 'listing',
      entityId: id,
      oldData: { title: listing.title, type: listing.type },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Listing delete error:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}