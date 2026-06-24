import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';
import { getTokenFromCookie, verifyToken } from '@/lib/auth';
import { Prisma } from '@prisma/client';

const listingSchema = z.object({
  type: z.enum(['SERVICE', 'PROJECT', 'REFERRAL', 'BUSINESS_SALE', 'ASSET_SALE']),
  title: z.string().min(5, 'Title must be at least 5 characters').max(120),
  description: z.string().min(20, 'Description must be at least 20 characters'),
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
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'PUBLISHED';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const q = searchParams.get('q');

    const where: Record<string, unknown> = { status };
    if (type) where.type = type;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          org: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Listings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validation = listingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Get or create default org for user
    let org = await prisma.organization.findFirst({
      where: { members: { some: { userId: user.id, role: 'OWNER' } } },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: user.name || user.email.split('@')[0],
          slug: user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
          type: 'SOLE_PROPRIETOR',
          metadata: {} as Prisma.InputJsonValue,
          members: { create: { userId: user.id, role: 'OWNER' } },
        },
      });
    }

    const data = validation.data;
    const listing = await prisma.listing.create({
      data: {
        orgId: org.id,
        type: data.type,
        title: data.title,
        description: data.description,
        pricing: data.pricing as unknown as Prisma.InputJsonValue,
        metadata: data.metadata as unknown as Prisma.InputJsonValue,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      include: { org: { select: { id: true, name: true, slug: true } } },
    });

    await createAuditLog({
      userId: user.id,
      action: 'LISTING_CREATED',
      entity: 'listing',
      entityId: listing.id,
      newData: { type: listing.type, title: listing.title },
    });

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    console.error('Listing create error:', error);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
  }
