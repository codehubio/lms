'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { getLocaleFromPath, type Locale } from '@/lib/i18n';
import { getUiText } from '@/lib/ui-text';
import type { GrammarEntry } from '@/types';

interface PronunciationTopicsListProps {
  entries: GrammarEntry[];
  selectedEntryId: string;
}

export default function PronunciationTopicsList({ entries, selectedEntryId }: PronunciationTopicsListProps) {
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
          
          // Special handling for pinyin-chart - use different route
          const href = entryItem.id === 'pronunciation-pinyin-chart'
            ? `/${locale}/pronunciation/pinyin-chart`
            : `/${locale}/pronunciation/${entryItem.id}`;
          
          return (
            <Link
              key={entryItem.id}
              href={href}
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
      ? (text.pronunciation?.noResultsMatching || 'No pronunciation topics found matching "{search}".').replace('{search}', searchTerm)
      : (text.pronunciation?.noResults || 'No pronunciation topics found');
    
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
        
        // Special handling for pinyin-chart - use different route
        const href = entryItem.id === 'pronunciation-pinyin-chart'
          ? `/${locale}/pronunciation/pinyin-chart${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`
          : `/${locale}/pronunciation/${entryItem.id}${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
        
        return (
          <Link
            key={entryItem.id}
            href={href}
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

