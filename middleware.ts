import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ALL_ROLES, ACCESS_MAP } from './lib/roles';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!pathname.startsWith('/portal')) return NextResponse.next();

  const cookie = req.cookies.get('role')?.value;
  const role = ALL_ROLES.includes(cookie as any) ? (cookie as any) : undefined;

  if (!role) {
    const url = new URL(`/auth/login?returnTo=${encodeURIComponent(pathname + search)}`, req.url);
    return NextResponse.redirect(url);
  }
  const allow = (ACCESS_MAP as any)[role] as string[];
  if (!allow?.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/403', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/:path*'],
};
