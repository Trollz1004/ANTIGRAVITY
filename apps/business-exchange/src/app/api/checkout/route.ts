import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit';
import { getTokenFromCookie, verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const checkoutSchema = z.object({
  listingId: z.string().min(1).optional(),
  amountCents: z.number().int().positive().max(10_000_000).optional(),
  note: z.string().max(500).optional(),
});

async function getUserFromRequest(request: NextRequest) {
  const cookies = request.headers.get('cookie') || '';
  const token = getTokenFromCookie(cookies);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return prisma.user.findUnique({ where: { id: payload.sub } });
}

function configuredSquareCheckoutUrl(): string {
  return (
    process.env.BUSINESS_EXCHANGE_SQUARE_CHECKOUT_URL ||
    process.env.NEXT_PUBLIC_BUSINESS_EXCHANGE_SQUARE_CHECKOUT_URL ||
    ''
  ).trim();
}

function fixedPriceCents(pricing: Prisma.JsonValue): number | null {
  if (!pricing || typeof pricing !== 'object' || Array.isArray(pricing)) return null;
  const model = String((pricing as Record<string, unknown>).model || '');
  const amount = Number((pricing as Record<string, unknown>).amount || 0);
  if (model !== 'FIXED' || !Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const validation = checkoutSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Invalid checkout request' },
        { status: 400 }
      );
    }

    const squareCheckoutUrl = configuredSquareCheckoutUrl();
    if (!squareCheckoutUrl) {
      return NextResponse.json(
        {
          error: 'Business Exchange Square checkout is not configured.',
          status: 'blocked',
          provider: 'square',
          paymentLane: 'business-exchange',
        },
        { status: 503 }
      );
    }

    const payload = validation.data;
    const listing = payload.listingId
      ? await prisma.listing.findUnique({
          where: { id: payload.listingId },
          include: { org: { select: { id: true, name: true, slug: true } } },
        })
      : null;

    if (payload.listingId && !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const amountCents = payload.amountCents || (listing ? fixedPriceCents(listing.pricing) : null);
    const checkoutReference = [
      'business-exchange',
      user.id,
      listing?.id || 'general',
      Date.now().toString(36),
    ].join(':');

    await createAuditLog({
      userId: user.id,
      action: 'BUSINESS_EXCHANGE_CHECKOUT_REQUESTED',
      entity: listing ? 'listing' : 'checkout',
      ...(listing?.id ? { entityId: listing.id } : {}),
      newData: {
        provider: 'square',
        paymentLane: 'business-exchange',
        checkoutReference,
        amountCents,
        listingTitle: listing?.title || null,
        note: payload.note || null,
      },
    });

    return NextResponse.json({
      provider: 'square',
      paymentLane: 'business-exchange',
      checkoutUrl: squareCheckoutUrl,
      checkoutReference,
      amountCents,
      listing: listing
        ? {
            id: listing.id,
            title: listing.title,
            type: listing.type,
            org: listing.org,
          }
        : null,
      instructions:
        'Complete checkout through Square. Keep the receipt id for support and reconciliation.',
    });
  } catch (error) {
    console.error('Business Exchange checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
