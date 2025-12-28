'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getLocaleFromPath, type Locale } from '@/lib/i18n';
import { getUiText } from '@/lib/ui-text';

export default function VocabularySearch() {
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
      params.set('page', '1'); // Reset to first page on new search
    } else {
      params.delete('search');
      params.set('page', '1');
    }
    router.push(`/${locale}/vocabulary?${params.toString()}`);
  }, [router, searchParams, locale]);

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
      <label htmlFor="vocabulary-search-input" className="sr-only">
        {text.dictionary.searchPlaceholder}
      </label>
      <input
        id="vocabulary-search-input"
        type="text"
        value={mounted ? searchTerm : ''}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={text.dictionary.searchPlaceholder}
        aria-label={text.dictionary.searchPlaceholder}
        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-2"
      />
      <p className="text-xs text-gray-500 mb-2 hidden sm:block">
        {text.dictionary.searchHelp}
      </p>
      <div className="flex gap-2">
        <button
          type="submit"
          aria-label={text.dictionary.searchButton}
          className="flex-1 sm:flex-none px-4 sm:px-6 py-2 text-sm sm:text-base bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition font-semibold"
        >
          {text.dictionary.searchButton}
        </button>
        {mounted && searchTerm && (
          <button
            type="button"
            onClick={() => handleSearch('')}
            aria-label={text.dictionary.clearButton}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            {text.dictionary.clearButton}
          </button>
        )}
      </div>
    </form>
  );
}

