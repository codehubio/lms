'use client';

import React, { useState, useEffect } from 'react';
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
    const currentLocale = getLocaleFromPath(pathname);
    setLocale(currentLocale);
  }, [pathname]);

  const toggleRow = (entryId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedRows(newExpanded);
  };

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
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 sm:px-6 w-20">
                  {/* Expand/collapse column */}
                </th>
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
                  Examples
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900 sm:px-6">
                  Tags
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {entries.flatMap((entry) => {
                const isExpanded = expandedRows.has(entry.id);
                const hasExamples = entry.examples && entry.examples.length > 0;
                const hasDescription = entry.description && entry.description.trim();
                
                const rows = [
                  <tr 
                    key={entry.id}
                    className={`hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}
                  >
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 sm:px-6">
                      {(hasExamples || hasDescription) && (
                        <button
                          onClick={() => toggleRow(entry.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                          title={isExpanded ? 'Collapse row' : 'Expand row'}
                        >
                          {isExpanded ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-gray-900 sm:px-6">
                      <div className="text-lg sm:text-xl">{entry.word}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 sm:px-6">
                      <div className="text-teal-700 font-medium">{entry.pinyin1}</div>
                      <div className="text-xs text-gray-500">({entry.pinyin2})</div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-700 sm:px-6">
                      <div className="font-semibold">{entry.translation}</div>
                      {hasDescription && !isExpanded && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{entry.description}</div>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-700 sm:px-6">
                      {hasExamples ? (
                        <div className="text-xs text-gray-600">
                          {entry.examples!.length} example{entry.examples!.length !== 1 ? 's' : ''}
                          {!isExpanded && entry.examples!.length > 0 && (
                            <div className="mt-1 text-gray-500 line-clamp-1">
                              {entry.examples![0].sentence}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
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
                ];

                if (isExpanded) {
                  rows.push(
                    <tr key={`${entry.id}-expanded`} className="bg-gray-50">
                      <td colSpan={6} className="px-3 py-4 sm:px-6">
                        <div className="space-y-4">
                          {/* Full Description */}
                          {hasDescription && (
                            <div>
                              <h5 className="text-xs font-semibold text-gray-700 mb-1">Description:</h5>
                              <p className="text-sm text-gray-600 leading-relaxed">{entry.description}</p>
                            </div>
                          )}
                          
                          {/* Example Sentences */}
                          {hasExamples && (
                            <div>
                              <h5 className="text-xs font-semibold text-gray-700 mb-2">Example Sentences:</h5>
                              <div className="space-y-2">
                                {entry.examples!.slice(0, 2).map((example, index) => {
                                  const exampleTranslation = locale === 'vi' 
                                    ? (example.translation.vi || example.translation.en)
                                    : (example.translation.en || example.translation.vi);
                                  
                                  return (
                                    <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                                      <p className="text-sm font-medium text-gray-900 mb-1">{example.sentence}</p>
                                      <p className="text-xs text-teal-700 mb-1">{example.pinyin1}</p>
                                      <p className="text-xs text-gray-600">{exampleTranslation}</p>
                                    </div>
                                  );
                                })}
                                {entry.examples!.length > 2 && (
                                  <p className="text-xs text-gray-500 italic">
                                    + {entry.examples!.length - 2} more example{entry.examples!.length - 2 !== 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }

                return rows;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

