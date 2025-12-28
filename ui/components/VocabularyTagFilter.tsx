'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getLocaleFromPath } from '@/lib/i18n';
import { getUiText } from '@/lib/ui-text';
import { TagGroup } from '@/types';
import { type Locale } from '@/proxy';

interface VocabularyTagFilterProps {
  tagGroups: TagGroup[];
}

export default function VocabularyTagFilter({ tagGroups }: VocabularyTagFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  // Initialize locale from pathname immediately
  const initialLocale = getLocaleFromPath(pathname);
  // Initialize text immediately (synchronous, bundled)
  const initialText = getUiText(initialLocale);
  // Start with empty tags to ensure consistent server/client render
  // Will be updated in useEffect from URL params (client-only)
  const [locale, setLocale] = useState<'en' | 'vi' | 'zh'>(initialLocale as 'en' | 'vi' | 'zh');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState<any>(initialText);

  useEffect(() => {
    setMounted(true);
    const currentLocale = getLocaleFromPath(pathname);
    setLocale(currentLocale);
    // Get all tag parameters from URL
    const tags = searchParams.getAll('tag').filter(Boolean);
    setSelectedTags(tags);
    
    // Load UI text (bundled, so synchronous)
    const uiText = getUiText(currentLocale);
    setText(uiText);
  }, [pathname, searchParams]);

  const handleTagToggle = useCallback((tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Toggle the tag
    const currentTags = searchParams.getAll('tag').filter(Boolean);
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag) // Remove if already selected
      : [...currentTags, tag]; // Add if not selected
    
    // Update URL parameters
    params.delete('tag'); // Remove all tag params
    newTags.forEach(t => params.append('tag', t)); // Add selected tags
    params.set('page', '1'); // Reset to first page on tag change
    
    setSelectedTags(newTags);
    router.push(`/${locale}/vocabulary?${params.toString()}`);
  }, [router, searchParams, locale]);

  const handleClearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tag');
    params.set('page', '1');
    setSelectedTags([]);
    router.push(`/${locale}/vocabulary?${params.toString()}`);
  }, [router, searchParams, locale]);

  // Show tag list immediately if we have tagGroups and text (both available from server)
  // Only wait for mounted state for interactive features
  if (tagGroups.length === 0 || !text) {
    return null;
  }

  // Helper function to get group display name with translation
  const getGroupDisplayName = (group: TagGroup): string => {
    if (group.display_name) {
      if (typeof group.display_name === 'string') {
        return group.display_name;
      }
      // Use current locale from state (which is initialized from pathname)
      // Support zh (Chinese) locale, fallback to en
      return group.display_name[locale] || group.display_name.zh || group.display_name.en;
    }
    // Fallback to formatting the name if display_name is not available
    if (group.name === 'HSK') return 'HSK';
    return group.name.charAt(0).toUpperCase() + group.name.slice(1);
  };

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <label className="block text-xs font-medium text-gray-700">
          {text.dictionary.filterByTags}
        </label>
        {selectedTags.length > 0 && (
          <button
            onClick={handleClearAll}
            aria-label={text.dictionary.clearAll}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
          >
            {text.dictionary.clearAll}
          </button>
        )}
      </div>
      
      {/* All badge */}
      <div className="mb-2 sm:mb-3">
        <button
          onClick={handleClearAll}
          aria-label={text.dictionary.all}
          className={`inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium transition ${
            selectedTags.length === 0
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {text.dictionary.all}
        </button>
      </div>

      {/* Tag groups */}
      <div className="space-y-2 sm:space-y-3">
        {tagGroups.map((group) => {
          if (!group.tags || group.tags.length === 0) {
            return null;
          }

          return (
            <div key={group.name} className="border-b border-gray-200 pb-2 sm:pb-3 last:border-b-0 last:pb-0">
              <h2 className="text-xs font-semibold text-gray-800 mb-1.5 sm:mb-2">
                {getGroupDisplayName(group)}
              </h2>
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                {group.tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.name);
                  // Get display name and description based on locale
                  // Support zh (Chinese) locale, fallback to en
                  const displayName = typeof tag.display_name === 'string' 
                    ? tag.display_name 
                    : tag.display_name[locale] || tag.display_name.zh || tag.display_name.en;
                  const description = typeof tag.description === 'string'
                    ? tag.description
                    : tag.description[locale] || tag.description.zh || tag.description.en;
                  
                  return (
                    <button
                      key={tag.name}
                      onClick={() => handleTagToggle(tag.name)}
                      aria-label={`${displayName}${description ? `: ${description}` : ''}`}
                      aria-pressed={isSelected}
                      className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium transition ${
                        isSelected
                          ? 'bg-teal-700 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={description}
                    >
                      {displayName}
                      {isSelected && (
                        <span className="ml-0.5 sm:ml-1 text-xs" aria-hidden="true">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

