import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getTokenFromCookie } from '@/lib/auth';

const publicPaths = ['/auth/login', '/auth/register', '/api/auth/login', '/api/auth/register', '/api/auth/me'];
const adminPaths = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookies = request.headers.get('cookie') || '';
  const membership record = getTokenFromCookie(cookies);

  // Check if path is public
  const isPublic = publicPaths.some(path => pathname.startsWith(path));
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path));

  // If no membership record and not public, redirect to login
  if (!membership record && !isPublic) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If membership record exists, verify it
  if (membership record) {
    const payload = await verifyToken(membership record);

    // Invalid membership record
    if (!payload) {
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.headers.set('Set-Cookie', 'be_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      return response;
    }

    // Check admin access
    if (isAdminPath && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // If accessing login/register with valid membership record, redirect to dashboard
  if (membership record && (pathname === '/auth/login' || pathname === '/auth/register')) {
    const payload = await verifyToken(membership record);
    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
