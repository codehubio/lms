'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getLocaleFromPath } from '@/lib/i18n';
import { getUiText } from '@/lib/ui-text';
import type { GrammarEntry, ParagraphExample } from '@/types';
import ReactMarkdown from 'react-markdown';
import VocabularyTooltip from './VocabularyTooltip';
import ParagraphExampleAudio from './ParagraphExampleAudio';

interface ParagraphEntryProps {
  entry: GrammarEntry;
}

export default function ParagraphEntry({ entry }: ParagraphEntryProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const locale = getLocaleFromPath(pathname || '') || 'en';
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Update document title immediately when entry changes to prevent flash
  useEffect(() => {
    if (!entry || !mounted) return;
    
    const entryTitle = entry.translation[locale as 'en' | 'vi' | 'zh'] || entry.translation.en || entry.title;
    const text = getUiText(locale);
    const fallbackText = getUiText('en');
    
    // Determine page type from pathname
    const isGrammar = pathname?.includes('/grammar');
    const isPronunciation = pathname?.includes('/pronunciation');
    
    let pageTitle = '';
    if (isGrammar) {
      const grammarTitle = text.grammar?.title || fallbackText.grammar?.title || 'Chinese Grammar';
      const navGrammar = text.nav?.grammar || fallbackText.nav?.grammar || 'Grammar';
      pageTitle = `${entryTitle} - ${grammarTitle} - ${navGrammar}`;
    } else if (isPronunciation) {
      const pronunciationTitle = text.pronunciation?.title || fallbackText.pronunciation?.title || 'Chinese Pronunciation';
      const navPronunciation = text.nav?.pronunciation || fallbackText.nav?.pronunciation || 'Pronunciation';
      pageTitle = `${entryTitle} - ${pronunciationTitle} - ${navPronunciation}`;
    } else {
      // Fallback
      pageTitle = entryTitle;
    }
    
    // Update document title immediately
    document.title = pageTitle;
  }, [entry, locale, mounted, pathname]);
  
  // Show loading skeleton before mounted to prevent hydration mismatches
  if (!mounted) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 sm:p-5 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }
  
  if (!entry) {
    return null;
  }
  
  const title = entry.translation[locale as 'en' | 'vi' | 'zh'] || entry.translation.en || entry.title;
  
  // Process data array to extract content
  // Each item in data has title.translation and body.translation
  const contentItems = Array.isArray(entry.data) ? entry.data : [];
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 sm:p-5 md:p-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
        {title}
      </h2>
      
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {entry.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="space-y-8">
        {contentItems.map((item: any, index: number) => {
          if (!item || typeof item !== 'object') return null;
          
          const itemTitle = item.title?.translation?.[locale as 'en' | 'vi' | 'zh'] 
            || item.title?.translation?.en 
            || '';
          const itemBody = item.body?.translation?.[locale as 'en' | 'vi' | 'zh'] 
            || item.body?.translation?.en 
            || '';
          
          // Replace placeholders and prepare for rendering with tooltips
          let processedBody = String(itemBody || '');
          let placeholderMap = item.placeholders && Array.isArray(item.placeholders) && item.placeholders.length > 0
            ? item.placeholders[0]
            : null;
          
          // If placeholderMap is a string, try to parse it
          if (typeof placeholderMap === 'string') {
            try {
              // First try JSON.parse
              placeholderMap = JSON.parse(placeholderMap);
            } catch (e) {
              // If JSON.parse fails, try parsing the custom format: {key=value, key2=value2}
              try {
                const customFormat = placeholderMap.trim();
                if (customFormat.startsWith('{') && customFormat.endsWith('}')) {
                  const content = customFormat.slice(1, -1); // Remove { and }
                  const pairs = content.split(',').map((p: string) => p.trim());
                  const parsed: Record<string, string> = {};
                  for (const pair of pairs) {
                    const equalIndex = pair.indexOf('=');
                    if (equalIndex > 0) {
                      const key = pair.substring(0, equalIndex).trim();
                      const value = pair.substring(equalIndex + 1).trim();
                      parsed[key] = value;
                    }
                  }
                  placeholderMap = parsed;
                } else {
                  placeholderMap = null;
                }
              } catch (e2) {
                placeholderMap = null;
              }
            }
          }
          
          // Create a set of placeholder words for quick lookup
          const placeholderWords = new Set<string>();
          if (placeholderMap && typeof placeholderMap === 'object' && !Array.isArray(placeholderMap)) {
            // Handle both plain objects and Map-like objects
            const entries = placeholderMap instanceof Map 
              ? Array.from(placeholderMap.entries())
              : Object.entries(placeholderMap);
            
            // Process all placeholders using simple string replacement
            for (const [key, value] of entries) {
              if (typeof value === 'string' && typeof key === 'string') {
                placeholderWords.add(value);
                const placeholder = `{{${key}}}`;
                const boldPlaceholder = `**${placeholder}**`;
                
                // Use split/join for reliable global replacement
                // Handle **{{key}}** pattern first
                if (processedBody.includes(boldPlaceholder)) {
                  processedBody = processedBody.split(boldPlaceholder).join(`**${value}**`);
                }
                // Then handle plain {{key}} pattern
                if (processedBody.includes(placeholder)) {
                  processedBody = processedBody.split(placeholder).join(`**${value}**`);
                }
              }
            }
          }
          
          // Custom component renderer for ReactMarkdown to wrap placeholder words in tooltips
          const markdownComponents = {
            // Use div instead of p to avoid nested div issues, with better spacing
            p: ({ children, ...props }: any) => (
              <div className="mb-6 last:mb-0 leading-relaxed text-gray-700" {...props}>{children}</div>
            ),
            // Better heading styles
            h1: ({ children, ...props }: any) => (
              <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-4 first:mt-0" {...props}>{children}</h1>
            ),
            h2: ({ children, ...props }: any) => (
              <h2 className="text-xl font-bold text-gray-900 mt-6 mb-4 first:mt-0" {...props}>{children}</h2>
            ),
            h3: ({ children, ...props }: any) => (
              <h3 className="text-lg font-semibold text-gray-900 mt-5 mb-3 first:mt-0" {...props}>{children}</h3>
            ),
            // Better list styles
            ul: ({ children, ...props }: any) => (
              <ul className="mb-6 ml-6 list-disc space-y-2 text-gray-700" {...props}>{children}</ul>
            ),
            ol: ({ children, ...props }: any) => (
              <ol className="mb-6 ml-6 list-decimal space-y-2 text-gray-700" {...props}>{children}</ol>
            ),
            li: ({ children, ...props }: any) => (
              <li className="leading-relaxed" {...props}>{children}</li>
            ),
            // Better code block styles
            code: ({ children, ...props }: any) => (
              <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono text-gray-800" {...props}>{children}</code>
            ),
            pre: ({ children, ...props }: any) => (
              <pre className="mb-6 p-4 bg-gray-100 rounded-lg overflow-x-auto" {...props}>{children}</pre>
            ),
            // Better blockquote styles
            blockquote: ({ children, ...props }: any) => (
              <blockquote className="mb-6 pl-4 border-l-4 border-gray-300 italic text-gray-600" {...props}>{children}</blockquote>
            ),
            strong: ({ children, ...props }: any) => {
              const text = typeof children === 'string' ? children : 
                          (Array.isArray(children) ? children.join('') : String(children || ''));
              
              // Check if this bold text is a placeholder word
              if (placeholderWords.has(text)) {
                return (
                  <VocabularyTooltip word={text} locale={locale}>
                    <strong className="font-semibold text-gray-900" {...props}>{children}</strong>
                  </VocabularyTooltip>
                );
              }
              
              return <strong className="font-semibold text-gray-900" {...props}>{children}</strong>;
            },
            // Better emphasis styles
            em: ({ children, ...props }: any) => (
              <em className="italic text-gray-700" {...props}>{children}</em>
            ),
            // Better horizontal rule
            hr: ({ ...props }: any) => (
              <hr className="my-8 border-gray-300" {...props} />
            ),
          };
          
          return (
            <div key={index} className="pb-8 border-b border-gray-200 last:border-b-0 last:pb-0">
              {itemTitle && (
                <h3 className="text-xl font-bold text-gray-900 mb-5 pb-2 border-b border-gray-300">
                  {itemTitle}
                </h3>
              )}
              {processedBody && (
                <div className="prose prose-base max-w-none">
                  <ReactMarkdown components={markdownComponents}>
                    {processedBody}
                  </ReactMarkdown>
                </div>
              )}
              
              {/* Render examples with audio if available */}
              {item.examples && Array.isArray(item.examples) && item.examples.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    {(() => {
                      const text = getUiText(locale);
                      const fallbackText = getUiText('en');
                      return text.grammar?.examples || text.pronunciation?.examples || fallbackText.grammar?.examples || 'Example Words';
                    })()}
                  </h4>
                  <div className="space-y-2">
                    {item.examples.map((example: ParagraphExample, exIndex: number) => (
                      <ParagraphExampleAudio
                        key={exIndex}
                        example={example}
                        locale={locale as 'en' | 'vi' | 'zh'}
                        size="md"
                        showText={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

