import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getTokenFromCookie } from '@/lib/auth';

const publicPaths = [
  '/auth/login',
  '/auth/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/me',
  '/api/health',
];
const adminPaths = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookies = request.headers.get('cookie') || '';
  const token = getTokenFromCookie(cookies);

  // Check if path is public
  const isPublic = publicPaths.some(path => pathname.startsWith(path));
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path));

  // If no token and not public, redirect to login
  if (!token && !isPublic) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If token exists, verify it
  if (token) {
    const payload = await verifyToken(token);

    // Invalid token
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

  // If accessing login/register with valid token, redirect to dashboard
  if (token && (pathname === '/auth/login' || pathname === '/auth/register')) {
    const payload = await verifyToken(token);
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
