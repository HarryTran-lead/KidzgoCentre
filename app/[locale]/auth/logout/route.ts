import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL('/', request.url));
  for (const name of [
    'role',
    'session-role',
    'x-role',
    'user-name',
    'user-avatar',
    'kidzgo.accessToken',
    'kidzgo.refreshToken',
  ]) {
    res.cookies.set(name, '', {
      path: '/',
      expires: new Date(0),
      sameSite: 'lax',
    });
  }
  return res;
}
