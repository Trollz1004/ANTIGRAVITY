import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createExpiredSessionCookie, getTokenFromCookie } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const cookies = request.headers.get('cookie') || '';
    const token = getTokenFromCookie(cookies);
    
    if (token) {
      const session = await prisma.session.findUnique({ where: { token } });
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
        await createAuditLog({
          userId: session.userId,
          action: 'USER_LOGOUT',
          entity: 'session',
          entityId: session.id,
        });
      }
    }

    const response = NextResponse.json({ success: true });
    response.headers.set('Set-Cookie', createExpiredSessionCookie());
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    const response = NextResponse.json({ success: true });
    response.headers.set('Set-Cookie', createExpiredSessionCookie());
    return response;
  }
}