import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL('/', request.url));
  res.cookies.set('role', '', { path: '/', expires: new Date(0) });
  return res;
}
