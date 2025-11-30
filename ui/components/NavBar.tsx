'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import { getLocaleFromPath, addLocaleToPath, type Locale, locales, defaultLocale } from '@/lib/i18n';
import { getUiText } from '@/lib/ui-text';

export default function NavBar() {
  const pathname = usePathname();
  
  // Compute locale synchronously from pathname - works on both server and client
  const locale = useMemo<Locale>(() => {
    if (!pathname || typeof pathname !== 'string') {
      return defaultLocale;
    }
    const localeFromPath = getLocaleFromPath(pathname);
    return locales.includes(localeFromPath) ? localeFromPath : defaultLocale;
  }, [pathname]);
  
  // Get text synchronously - getUiText is synchronous and cached
  const text = useMemo(() => {
    return getUiText(locale);
  }, [locale]);
  
  // Generate paths synchronously using the locale
  const { homePath, vocabularyPath, grammarPath, aboutPath } = useMemo(() => {
    return {
      homePath: addLocaleToPath('/', locale),
      vocabularyPath: addLocaleToPath('/vocabulary', locale),
      grammarPath: addLocaleToPath('/grammar', locale),
      aboutPath: addLocaleToPath('/about', locale),
    };
  }, [locale]);

  return (
    <nav className="bg-teal-700 text-white py-2 sm:py-3 px-4 sm:px-6 flex justify-between items-center w-full flex-shrink-0" suppressHydrationWarning>
      <Link href={homePath} className="text-lg sm:text-xl md:text-2xl font-bold hover:opacity-80 transition" suppressHydrationWarning>
        {text.nav.brand}
      </Link>
      <div className="flex items-center gap-4">
        <ul className="flex space-x-2 sm:space-x-4 text-sm sm:text-base">
          <li><Link href={homePath} className="hover:underline" suppressHydrationWarning>{text.nav.home}</Link></li>
          <li><Link href={vocabularyPath} className="hover:underline" suppressHydrationWarning>{text.nav.dictionary}</Link></li>
          <li><Link href={grammarPath} className="hover:underline" suppressHydrationWarning>{text.nav.grammar || 'Grammar'}</Link></li>
          <li><Link href={aboutPath} className="hover:underline hidden sm:inline" suppressHydrationWarning>{text.nav.about}</Link></li>
        </ul>
        <LanguageSwitcher />
      </div>
    </nav>
  );
}

