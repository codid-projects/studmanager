import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './lib/i18n';
import { AUTH_COOKIE, AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE, AUTH_VALUE } from './lib/auth';

const PUBLIC_FILE_REGEX = /\.[^/]+$/;

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    PUBLIC_FILE_REGEX.test(pathname)
  ) {
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
    const authCookie = request.cookies.get(AUTH_COOKIE)?.value;
    const isAuthenticated = authCookie === AUTH_VALUE;
    const locale = locales.find(
      (value) => pathname.startsWith(`/${value}/`) || pathname === `/${value}`
    ) || defaultLocale;
    const isLoginRoute = pathname === `/${locale}/login`;
    const isLocaleIndex = pathname === `/${locale}`;
    const isExpiredSession = request.nextUrl.searchParams.get('session') === 'expired';

    if (isLocaleIndex) {
      return NextResponse.redirect(
        new URL(`/${locale}/${isAuthenticated ? 'dashboard' : 'login'}`, request.url)
      );
    }

    if (isLoginRoute && isExpiredSession) {
      const response = NextResponse.next();

      for (const cookieName of [AUTH_COOKIE, AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE]) {
        response.cookies.set(cookieName, '', {
          path: '/',
          maxAge: 0,
        });
      }

      return response;
    }

    if (isLoginRoute && isAuthenticated) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }

    if (!isLoginRoute && !isAuthenticated) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
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
    '/((?!api|_next|.*\\..*).*)',
  ],
};
