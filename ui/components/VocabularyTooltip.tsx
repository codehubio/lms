'use client';

import { useState, useEffect, useRef } from 'react';
import type { DictionaryEntry } from '@/types';

interface VocabularyTooltipProps {
  word: string;
  locale: string;
  children: React.ReactNode;
}

export default function VocabularyTooltip({ word, locale, children }: VocabularyTooltipProps) {
  const [vocabEntry, setVocabEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const fetchVocabulary = async (searchWord: string) => {
    if (!searchWord || loading) return;
    
    setLoading(true);
    try {
      // Use a larger pageSize to ensure we can find exact matches
      // The search might return partial matches first, so we need more results
      const response = await fetch(`/api/vocabulary?search=${encodeURIComponent(searchWord)}&pageSize=20&language=${locale}`);
      const data = await response.json();
      
      if (data.success && data.data?.entries && data.data.entries.length > 0) {
        // Find exact match (case-sensitive for Chinese characters)
        // Prioritize exact word match over partial matches
        const exactMatch = data.data.entries.find((entry: DictionaryEntry) => entry.word === searchWord);
        setVocabEntry(exactMatch || null);
      } else {
        setVocabEntry(null);
      }
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
      setVocabEntry(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Small delay before showing tooltip
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        
        // For fixed positioning, use viewport coordinates directly (no scroll offset)
        const tooltipWidth = 320; // Approximate max width
        const tooltipHeight = 250; // Approximate max height
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const spacing = 2; // Minimal space between trigger and tooltip
        
        // Calculate initial position (centered horizontally, just below the word)
        let left = rect.left + rect.width / 2;
        let top = rect.bottom + spacing;
        
        // Adjust horizontal position if tooltip would go off-screen
        const halfTooltipWidth = tooltipWidth / 2;
        if (left - halfTooltipWidth < 10) {
          // Too far left, align to left edge with padding
          left = 10 + halfTooltipWidth;
        } else if (left + halfTooltipWidth > viewportWidth - 10) {
          // Too far right, align to right edge with padding
          left = viewportWidth - 10 - halfTooltipWidth;
        }
        
        // Adjust vertical position if tooltip would go off-screen (show above instead)
        if (top + tooltipHeight > viewportHeight - 10) {
          // Not enough space below, show above
          top = rect.top - tooltipHeight - spacing;
          // If still doesn't fit above, position at top of viewport
          if (top < 10) {
            top = 10;
          }
        }
        
        setTooltipPosition({ top, left });
      }
      setShowTooltip(true);
      fetchVocabulary(word);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowTooltip(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        className="cursor-help underline decoration-dotted decoration-gray-400"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
      {showTooltip && (
        <div
          className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-sm pointer-events-none"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : vocabEntry ? (
            <div className="space-y-2">
              <div className="font-bold text-lg text-gray-900">{vocabEntry.word}</div>
              <div className="text-sm text-gray-600">
                {vocabEntry.pinyin1 || vocabEntry.pinyin2}
              </div>
              <div className="text-sm text-gray-700">
                {vocabEntry.translation}
              </div>
              {vocabEntry.description && (
                <div className="text-sm text-gray-600 italic">{vocabEntry.description}</div>
              )}
              {vocabEntry.examples && vocabEntry.examples.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    {locale === 'zh' ? '例句' : locale === 'vi' ? 'Ví dụ' : 'Examples'}
                  </div>
                  <div className="space-y-2">
                    {vocabEntry.examples.slice(0, 3).map((example, idx) => {
                      // Get translation based on locale, with fallback
                      let exampleTranslation = '';
                      if (locale === 'vi' && example.translation.vi) {
                        exampleTranslation = example.translation.vi;
                      } else if (locale === 'zh') {
                        // For Chinese locale, fallback to English since ExampleSentence doesn't have zh
                        exampleTranslation = example.translation.en || example.translation.vi;
                      } else {
                        // Default to English
                        exampleTranslation = example.translation.en || example.translation.vi;
                      }
                      
                      return (
                        <div key={idx} className="text-sm">
                          <div className="text-gray-900 font-medium">{example.sentence}</div>
                          <div className="text-gray-600">{example.pinyin1 || example.pinyin2}</div>
                          <div className="text-gray-700">{exampleTranslation}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              {locale === 'zh' ? '词汇表中未找到' : locale === 'vi' ? 'Không tìm thấy trong từ vựng' : 'Not found in vocabulary'}
            </div>
          )}
        </div>
      )}
    </>
  );
}

