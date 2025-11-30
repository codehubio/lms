'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getLocaleFromPath } from '@/lib/i18n';
import { DictionaryEntry as DictionaryEntryType } from '@/types';

interface VocabularyTableViewProps {
  entries: DictionaryEntryType[];
}

export default function VocabularyTableView({ entries }: VocabularyTableViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [locale, setLocale] = useState<string>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentLocale = getLocaleFromPath(pathname);
    setLocale(currentLocale);
  }, [pathname]);

  // Tag color mapping
  const tagColors: Record<string, string> = {
    'HSK1': 'bg-green-100 text-green-800',
    'HSK2': 'bg-blue-100 text-blue-800',
    'HSK3': 'bg-yellow-100 text-yellow-800',
    'HSK4': 'bg-orange-100 text-orange-800',
    'HSK5': 'bg-red-100 text-red-800',
    'HSK6': 'bg-purple-100 text-purple-800',
    'HSK7': 'bg-pink-100 text-pink-800',
    'HSK8': 'bg-indigo-100 text-indigo-800',
    'HSK9': 'bg-cyan-100 text-cyan-800',
  };

  const getTagDisplayName = (tag: string): string => {
    if (tag.startsWith('HSK')) {
      const level = tag.substring(3);
      return `HSK ${level}`;
    }
    return tag;
  };

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const locale = getLocaleFromPath(pathname);
    const params = new URLSearchParams(searchParams.toString());
    
    const currentTags = searchParams.getAll('tag').filter(Boolean);
    
    if (!currentTags.includes(tag)) {
      params.append('tag', tag);
    }
    
    params.set('page', '1');
    
    router.push(`/${locale}/vocabulary?${params.toString()}`);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 sm:px-6">
                  Word
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 sm:px-6">
                  Pinyin
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 sm:px-6">
                  Translation
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 sm:px-6">
                  Tags
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-gray-900 sm:px-6">
                    {entry.word}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 sm:px-6">
                    <div className="text-teal-700 font-medium">{entry.pinyin1}</div>
                    <div className="text-xs text-gray-500">({entry.pinyin2})</div>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-700 sm:px-6">
                    <div>{entry.translation}</div>
                    {entry.description && entry.description.trim() && (
                      <div className="text-xs text-gray-500 mt-1">{entry.description}</div>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-700 sm:px-6">
                    {entry.tags && entry.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map((tag, index) => (
                          <button
                            key={index}
                            onClick={(e) => handleTagClick(tag, e)}
                            className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors hover:opacity-80 cursor-pointer ${
                              tagColors[tag] || 'bg-gray-100 text-gray-800'
                            }`}
                            title={`Filter by ${getTagDisplayName(tag)}`}
                          >
                            {getTagDisplayName(tag)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

