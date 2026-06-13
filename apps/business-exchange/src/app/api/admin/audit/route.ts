import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/audit';
import { getTokenFromCookie, verifyToken } from '@/lib/auth';

async function getAdminUser(request: NextRequest) {
  const cookies = request.headers.get('cookie') || '';
  const token = getTokenFromCookie(cookies);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.role !== 'ADMIN') return null;
  return user;
}

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser(request);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const entity = searchParams.get('entity') || undefined;
    const action = searchParams.get('action') || undefined;
    const userId = searchParams.get('userId') || undefined;

    const { logs, total } = await getAuditLogs({
      entity,
      action,
      userId,
      limit,
      offset: (page - 1) * limit,
    });

    return NextResponse.json({
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin audit fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}