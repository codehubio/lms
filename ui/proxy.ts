import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Supported locales
export const locales = ['en', 'vi', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude metadata routes (sitemap, robots.txt, etc.) from locale redirection
  const metadataRoutes = ['/sitemap.xml', '/robots.txt', '/manifest.json'];
  if (metadataRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If pathname already has a locale, continue
  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Get locale from Accept-Language header or use default
  const acceptLanguage = request.headers.get('accept-language') || '';
  let locale = defaultLocale;

  // Try to detect locale from Accept-Language header
  if (acceptLanguage.includes('vi')) {
    locale = 'vi';
  } else if (acceptLanguage.includes('zh')) {
    locale = 'zh';
  } else if (acceptLanguage.includes('en')) {
    locale = 'en';
  }

  // Redirect to locale-prefixed path
  // For root path, ensure we redirect to /locale/ (with trailing slash)
  const path = pathname === '/' ? `/${locale}/` : `/${locale}${pathname}`;
  const newUrl = new URL(path, request.url);
  // Use 307 (temporary redirect) to preserve method and body
  return NextResponse.redirect(newUrl, 307);
}

export const config = {
  // Match all pathnames except for:
  // - api routes
  // - _next (Next.js internals)
  // - static files (images, audio, favicon, etc.)
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav|ogg|m4a)$).*)',
  ],
};

