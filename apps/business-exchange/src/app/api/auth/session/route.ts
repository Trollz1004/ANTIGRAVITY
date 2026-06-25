import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, createToken, createSessionCookie, getTokenFromCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookies = request.headers.get('cookie') || '';
    const token = getTokenFromCookie(cookies);
    
    if (!token) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const session = await prisma.session.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const newToken = await createToken({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const sessionToken = generateSessionToken();
    
    await prisma.session.update({
      where: { id: session.id },
      data: { token: sessionToken, expiresAt },
    });

    const response = NextResponse.json({ success: true });
    response.headers.set('Set-Cookie', createSessionCookie(newToken, expiresAt));
    return response;
  } catch (error) {
    console.error('Session refresh error:', error);
    return NextResponse.json({ success: false }, { status: 401 });
  }
}