import { NextResponse } from 'next/server';
import { AUTH_COOKIE, AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });

  for (const cookieName of [AUTH_COOKIE, AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE]) {
    response.cookies.set(cookieName, '', {
      path: '/',
      maxAge: 0,
    });
  }

  return response;
}
