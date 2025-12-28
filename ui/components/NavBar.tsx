'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import { getLocaleFromPath, addLocaleToPath, type Locale, locales, defaultLocale } from '@/lib/i18n';
import { getUiText } from '@/lib/ui-text';

export default function NavBar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
  const { homePath, vocabularyPath, pronunciationPath, grammarPath, aboutPath } = useMemo(() => {
    return {
      homePath: addLocaleToPath('/', locale),
      vocabularyPath: addLocaleToPath('/vocabulary', locale),
      pronunciationPath: addLocaleToPath('/pronunciation', locale),
      grammarPath: addLocaleToPath('/grammar', locale),
      aboutPath: addLocaleToPath('/about', locale),
    };
  }, [locale]);

  return (
    <nav className="bg-teal-700 text-white py-2 sm:py-3 px-4 sm:px-6 w-full flex-shrink-0" suppressHydrationWarning>
      <div className="flex justify-between items-center">
        <Link href={homePath} className="text-lg sm:text-xl md:text-2xl font-bold hover:opacity-80 transition" suppressHydrationWarning>
          {text.nav.brand}
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <ul className="flex space-x-2 sm:space-x-4 text-sm sm:text-base">
            <li><Link href={homePath} className="hover:underline" suppressHydrationWarning>{text.nav.home}</Link></li>
            <li><Link href={vocabularyPath} className="hover:underline" suppressHydrationWarning>{text.nav.dictionary}</Link></li>
            <li><Link href={pronunciationPath} className="hover:underline" suppressHydrationWarning>{text.nav.pronunciation}</Link></li>
            <li><Link href={grammarPath} className="hover:underline" suppressHydrationWarning>{text.nav.grammar || 'Grammar'}</Link></li>
            <li><Link href={aboutPath} className="hover:underline" suppressHydrationWarning>{text.nav.about}</Link></li>
          </ul>
          <LanguageSwitcher />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-teal-600 rounded transition"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pb-2 border-t border-teal-600 pt-4">
          <ul className="flex flex-col space-y-3 text-base">
            <li>
              <Link 
                href={homePath} 
                className="block py-2 hover:bg-teal-600 rounded px-2 transition" 
                onClick={() => setIsMobileMenuOpen(false)}
                suppressHydrationWarning
              >
                {text.nav.home}
              </Link>
            </li>
            <li>
              <Link 
                href={vocabularyPath} 
                className="block py-2 hover:bg-teal-600 rounded px-2 transition" 
                onClick={() => setIsMobileMenuOpen(false)}
                suppressHydrationWarning
              >
                {text.nav.dictionary}
              </Link>
            </li>
            <li>
              <Link 
                href={pronunciationPath} 
                className="block py-2 hover:bg-teal-600 rounded px-2 transition" 
                onClick={() => setIsMobileMenuOpen(false)}
                suppressHydrationWarning
              >
                {text.nav.pronunciation}
              </Link>
            </li>
            <li>
              <Link 
                href={grammarPath} 
                className="block py-2 hover:bg-teal-600 rounded px-2 transition" 
                onClick={() => setIsMobileMenuOpen(false)}
                suppressHydrationWarning
              >
                {text.nav.grammar || 'Grammar'}
              </Link>
            </li>
            <li>
              <Link 
                href={aboutPath} 
                className="block py-2 hover:bg-teal-600 rounded px-2 transition" 
                onClick={() => setIsMobileMenuOpen(false)}
                suppressHydrationWarning
              >
                {text.nav.about}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

