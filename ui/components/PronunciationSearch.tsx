'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getLocaleFromPath, type Locale } from '@/lib/i18n';
import { getUiText } from '@/lib/ui-text';

export default function PronunciationSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Initialize locale from pathname immediately
  const initialLocale = getLocaleFromPath(pathname);
  // Initialize text immediately (synchronous, bundled)
  const initialText = getUiText(initialLocale);
  // Start with empty search term to ensure consistent server/client render
  // Will be updated in useEffect from URL params (client-only)
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState<any>(initialText);

  useEffect(() => {
    setMounted(true);
    const currentLocale = getLocaleFromPath(pathname);
    setLocale(currentLocale);
    // Get search term from URL (only on client)
    setSearchTerm(searchParams.get('search') || '');
    
    // Load UI text (bundled, so synchronous)
    const uiText = getUiText(currentLocale);
    setText(uiText);
  }, [pathname, searchParams]);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set('search', value.trim());
    } else {
      params.delete('search');
    }
    // Get current entry from pathname
    const pathParts = pathname.split('/');
    const entryId = pathParts[pathParts.length - 1];
    // Navigate to the same entry with search param
    router.push(`/${locale}/pronunciation/${entryId}?${params.toString()}`);
  }, [router, searchParams, locale, pathname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  // Ensure we have text before rendering (should always be available since it's initialized)
  if (!text) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 sm:mb-6" suppressHydrationWarning>
      <label htmlFor="pronunciation-search-input" className="sr-only">
        {text.pronunciation?.searchPlaceholder || 'Search pronunciation topics...'}
      </label>
      <input
        id="pronunciation-search-input"
        type="text"
        value={mounted ? searchTerm : ''}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={text.pronunciation?.searchPlaceholder || 'Search pronunciation topics...'}
        aria-label={text.pronunciation?.searchPlaceholder || 'Search pronunciation topics...'}
        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-2"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          aria-label={text.pronunciation?.searchButton || 'Search'}
          className="flex-1 sm:flex-none px-4 sm:px-6 py-2 text-sm sm:text-base bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition font-semibold"
        >
          {text.pronunciation?.searchButton || 'Search'}
        </button>
        {mounted && searchTerm && (
          <button
            type="button"
            onClick={() => handleSearch('')}
            aria-label={text.pronunciation?.clearButton || 'Clear'}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            {text.pronunciation?.clearButton || 'Clear'}
          </button>
        )}
      </div>
    </form>
  );
}

