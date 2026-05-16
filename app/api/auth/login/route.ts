import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE, AUTH_VALUE } from '@/lib/auth';
import { ApiError, localizeApiMessage } from '@/lib/api/errors';
import { loginUser } from '@/lib/api/auth-service';
import type { LocaleCode } from '@/lib/api/types';

function getMaxAge(rememberMe: boolean) {
  return rememberMe ? 60 * 60 * 24 * 30 : undefined;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const locale = (body?.locale === 'en' ? 'en' : 'ar') as LocaleCode;

  if (!body?.username || !body?.password) {
    return NextResponse.json(
      { message: localizeApiMessage('Invalid credentials.', locale) },
      { status: 400 },
    );
  }

  try {
    const result = await loginUser({
      username: String(body.username),
      password: String(body.password),
    });

    if (!result.succeeded || !result.data?.accessToken) {
      return NextResponse.json(
        { message: localizeApiMessage(result.message, locale) },
        { status: result.statusCode || 401 },
      );
    }

    const maxAge = getMaxAge(Boolean(body.rememberMe));
    const response = NextResponse.json({
      user: {
        userId: result.data.userId,
        username: result.data.username,
        fullName: result.data.fullName,
        userProfileImage: result.data.userProfileImage,
        roles: result.data.roles,
      },
      message: localizeApiMessage(result.message, locale),
    });

    response.cookies.set(AUTH_COOKIE, AUTH_VALUE, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });
    response.cookies.set(AUTH_TOKEN_COOKIE, result.data.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge,
      expires: maxAge ? undefined : new Date(result.data.expiresAt),
    });
    response.cookies.set(
      AUTH_USER_COOKIE,
      JSON.stringify({
        userId: result.data.userId,
        username: result.data.username,
        fullName: result.data.fullName,
        roles: result.data.roles,
      }),
      {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge,
      },
    );

    return response;
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : null;

    return NextResponse.json(
      { message: localizeApiMessage(message, locale) },
      { status },
    );
  }
}
