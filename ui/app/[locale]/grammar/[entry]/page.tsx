import Link from 'next/link';
import { Suspense } from 'react';
import { fetchGrammarEntries } from '@/lib/data';
import ParagraphEntry from '@/components/ParagraphEntry';
import GrammarSearch from '@/components/GrammarSearch';
import GrammarTopicsList from '@/components/GrammarTopicsList';
import { locales, type Locale, defaultLocale } from '@/proxy';
import { getUiText } from '@/lib/ui-text';
import { generateSEOMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Disable static generation - page needs database access
export const dynamic = 'force-dynamic';

interface GrammarEntryPageProps {
  params: Promise<{ locale: string; entry: string }>;
  searchParams: Promise<{ search?: string }>;
}

/**
 * Generate metadata for the grammar entry page with multilingual support
 */
export async function generateMetadata({ params }: GrammarEntryPageProps): Promise<Metadata> {
  const { locale, entry } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  const text = await getUiText(validLocale);
  
  // Fallback to English if translation is missing
  const fallbackText = await getUiText('en');
  
  // Fetch grammar entries to get the entry title
  const grammarEntries = await fetchGrammarEntries({ language: validLocale });
  const selectedEntry = grammarEntries.find(e => e.id === entry);
  
  const pageTitle = text.grammar?.title || fallbackText.grammar?.title || 'Chinese Grammar';
  const baseDescription = text.grammar?.subtitle || fallbackText.grammar?.subtitle || 'Comprehensive Chinese grammar explanations';
  
  if (!selectedEntry) {
    const title = `${pageTitle} - ${text.nav?.grammar || fallbackText.nav?.grammar || 'Grammar'}`;
    return generateSEOMetadata({
      title,
      description: baseDescription,
      locale: validLocale,
      path: `/${validLocale}/grammar`,
      keywords: ['Chinese grammar', 'grammar explanations'],
    });
  }
  
  const entryTitle = selectedEntry.translation[validLocale] || selectedEntry.translation.en || selectedEntry.title;
  const title = `${entryTitle} - ${pageTitle} - ${text.nav?.grammar || fallbackText.nav?.grammar || 'Grammar'}`;
  const description = `${entryTitle}: ${baseDescription}`;
  
  return generateSEOMetadata({
    title,
    description,
    locale: validLocale,
    path: `/${validLocale}/grammar/${entry}`,
    keywords: ['Chinese grammar', entryTitle, 'grammar explanations', 'Mandarin'],
    type: 'article',
  });
}

/**
 * Grammar Entry Page - Server Component
 * Displays a specific grammar entry
 */
export default async function GrammarEntryPage({ params, searchParams }: GrammarEntryPageProps) {
  const { locale, entry } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  
  const startTime = Date.now();
  
  // Fetch grammar entries
  const grammarEntries = await fetchGrammarEntries({ language: validLocale });
  
  const text = await getUiText(validLocale);
  
  const duration = Date.now() - startTime;
  const logData = {
    type: 'other',
    action: 'grammarEntryPage',
    locale,
    entry,
    duration,
    entriesCount: grammarEntries.length,
    success: true,
  };
  console.log(JSON.stringify(logData));

  // Find selected entry
  const selectedEntry = grammarEntries.find(e => e.id === entry);
  
  if (!selectedEntry) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 py-6 sm:py-8 md:py-12 px-4 sm:px-6 md:px-8 w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
            {text.grammar?.title || 'Chinese Grammar'}
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            {text.grammar?.subtitle || 'Comprehensive Chinese grammar explanations'}
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left column: Grammar Topics List */}
          <div className="lg:col-span-3">
            <div className="sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {text.grammar?.topics || 'Topics'}
              </h2>
              <Suspense fallback={<div className="mb-4 h-20 bg-gray-100 rounded-lg animate-pulse" />}>
                <GrammarSearch />
              </Suspense>
              {grammarEntries.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  {text.grammar?.noResults || 'No grammar topics found'}
                </p>
              ) : (
                <Suspense fallback={<div className="space-y-2"><div className="h-12 bg-gray-100 rounded-lg animate-pulse" /><div className="h-12 bg-gray-100 rounded-lg animate-pulse" /></div>}>
                  <GrammarTopicsList 
                    entries={grammarEntries} 
                    selectedEntryId={selectedEntry.id}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Right column: Grammar Content */}
          <div className="lg:col-span-9">
            {selectedEntry ? (
              <ParagraphEntry entry={selectedEntry} />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {text.grammar?.noResults || 'No grammar topics found'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

