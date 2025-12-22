'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { getLocaleFromPath, type Locale } from '@/lib/i18n';
import { getUiText } from '@/lib/ui-text';
import type { GrammarEntry } from '@/types';

interface GrammarTopicsListProps {
  entries: GrammarEntry[];
  selectedEntryId: string;
}

export default function GrammarTopicsList({ entries, selectedEntryId }: GrammarTopicsListProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const currentLocale = getLocaleFromPath(pathname);
    setLocale(currentLocale);
    const uiText = getUiText(currentLocale);
    setText(uiText);
  }, [pathname]);

  // Get search term from URL
  const searchTerm = mounted ? (searchParams.get('search') || '').toLowerCase().trim() : '';

  // Filter entries based on search term
  const filteredEntries = useMemo(() => {
    if (!searchTerm) {
      return entries;
    }

    return entries.filter((entry) => {
      const entryTitle = entry.translation[locale] || entry.translation.en || entry.title;
      const entryId = entry.id.toLowerCase();
      
      // Search in title, translation, and id
      return (
        entryTitle.toLowerCase().includes(searchTerm) ||
        entryId.includes(searchTerm) ||
        Object.values(entry.translation).some(
          (translation) => typeof translation === 'string' && translation.toLowerCase().includes(searchTerm)
        )
      );
    });
  }, [entries, searchTerm, locale]);

  if (!mounted || !text) {
    return (
      <div className="space-y-2">
        {entries.map((entryItem) => {
          const entryTitle = entryItem.translation[locale] || entryItem.translation.en || entryItem.title;
          const isSelected = selectedEntryId === entryItem.id;
          
          return (
            <Link
              key={entryItem.id}
              href={`/${locale}/grammar/${entryItem.id}`}
              className={`block p-3 rounded-lg border transition ${
                isSelected
                  ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {entryTitle}
            </Link>
          );
        })}
      </div>
    );
  }

  if (filteredEntries.length === 0) {
    const noResultsText = searchTerm
      ? (text.grammar?.noResultsMatching || 'No grammar topics found matching "{search}".').replace('{search}', searchTerm)
      : (text.grammar?.noResults || 'No grammar topics found');
    
    return (
      <p className="text-gray-500 text-sm">
        {noResultsText}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {filteredEntries.map((entryItem) => {
        const entryTitle = entryItem.translation[locale] || entryItem.translation.en || entryItem.title;
        const isSelected = selectedEntryId === entryItem.id;
        
        return (
          <Link
            key={entryItem.id}
            href={`/${locale}/grammar/${entryItem.id}${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`}
            className={`block p-3 rounded-lg border transition ${
              isSelected
                ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {entryTitle}
          </Link>
        );
      })}
    </div>
  );
}

