/**
 * i18n utilities for Next.js App Router
 */

import { locales, type Locale, defaultLocale } from '@/proxy';

export { locales, type Locale, defaultLocale };

/**
 * Get locale from pathname
 */
export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale;
  }

  return defaultLocale;
}

/**
 * Remove locale from pathname
 */
export function removeLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && locales.includes(firstSegment as Locale)) {
    return '/' + segments.slice(1).join('/');
  }

  return pathname;
}

/**
 * Add locale to pathname
 */
export function addLocaleToPath(pathname: string, locale: Locale): string {
  const pathWithoutLocale = removeLocaleFromPath(pathname);
  return `/${locale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
}

