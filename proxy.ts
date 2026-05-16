import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './lib/i18n';
import { AUTH_COOKIE, AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE, AUTH_VALUE } from './lib/auth';

const PUBLIC_FILE_REGEX = /\.[^/]+$/;
const AUTH_API_PREFIX = '/api/auth';

function clearAuthCookies(response: NextResponse) {
  for (const cookieName of [AUTH_COOKIE, AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE]) {
    response.cookies.set(cookieName, '', {
      path: '/',
      maxAge: 0,
    });
  }

  return response;
}

function isAuthenticated(request: NextRequest) {
  const authCookie = request.cookies.get(AUTH_COOKIE)?.value;
  const tokenCookie = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

  return authCookie === AUTH_VALUE && Boolean(tokenCookie);
}

function getPathLocale(pathname: string) {
  return locales.find(
    (value) => pathname.startsWith(`/${value}/`) || pathname === `/${value}`,
  );
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next') ||
    PUBLIC_FILE_REGEX.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api')) {
    if (pathname.startsWith(AUTH_API_PREFIX)) {
      return NextResponse.next();
    }

    if (!isAuthenticated(request)) {
      return clearAuthCookies(
        NextResponse.json(
          { message: 'Unauthorized', statusCode: 401, succeeded: false },
          { status: 401 },
        ),
      );
    }

    return NextResponse.next();
  }

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(`/${defaultLocale}/login`, request.url)
    );
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    const authenticated = isAuthenticated(request);
    const locale = getPathLocale(pathname) || defaultLocale;
    const isLoginRoute = pathname === `/${locale}/login`;
    const isLocaleIndex = pathname === `/${locale}`;
    const isExpiredSession = request.nextUrl.searchParams.get('session') === 'expired';

    if (isLocaleIndex) {
      return NextResponse.redirect(
        new URL(`/${locale}/${authenticated ? 'dashboard' : 'login'}`, request.url)
      );
    }

    if (isLoginRoute && isExpiredSession) {
      return clearAuthCookies(NextResponse.next());
    }

    if (isLoginRoute && authenticated) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }

    if (!isLoginRoute && !authenticated) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('session', 'expired');
      return clearAuthCookies(NextResponse.redirect(loginUrl));
    }

    return NextResponse.next();
  }

  // Redirect to default locale
  return NextResponse.redirect(
    new URL(`/${defaultLocale}${pathname}`, request.url)
  );
}

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)',
  ],
};
