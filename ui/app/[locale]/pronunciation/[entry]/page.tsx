import Link from 'next/link';
import { Suspense } from 'react';
import { fetchPronunciationEntries } from '@/lib/data';
import ParagraphEntry from '@/components/ParagraphEntry';
import PronunciationSearch from '@/components/PronunciationSearch';
import PronunciationTopicsList from '@/components/PronunciationTopicsList';
import { locales, type Locale, defaultLocale } from '@/proxy';
import { getUiText } from '@/lib/ui-text';
import { generateSEOMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

// Disable static generation - page needs database access
export const dynamic = 'force-dynamic';

interface PronunciationEntryPageProps {
  params: Promise<{ locale: string; entry: string }>;
  searchParams: Promise<{ search?: string }>;
}

/**
 * Generate metadata for the pronunciation entry page with multilingual support
 */
export async function generateMetadata({ params }: PronunciationEntryPageProps): Promise<Metadata> {
  const { locale, entry } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  const text = await getUiText(validLocale);
  
  // Fallback to English if translation is missing
  const fallbackText = await getUiText('en');
  
  // Fetch pronunciation entries to get the entry title
  const pronunciationEntries = await fetchPronunciationEntries({ language: validLocale });
  const selectedEntry = pronunciationEntries.find(e => e.id === entry);
  
  const pageTitle = text.pronunciation?.title || fallbackText.pronunciation?.title || 'Chinese Pronunciation';
  const baseDescription = text.pronunciation?.subtitle || fallbackText.pronunciation?.subtitle || 'Comprehensive Chinese pronunciation guides';
  
  if (!selectedEntry) {
    const title = `${pageTitle} - ${text.nav?.pronunciation || fallbackText.nav?.pronunciation || 'Pronunciation'}`;
    return generateSEOMetadata({
      title,
      description: baseDescription,
      locale: validLocale,
      path: `/${validLocale}/pronunciation`,
      keywords: ['Chinese pronunciation', 'pronunciation guides'],
    });
  }
  
  const entryTitle = selectedEntry.translation[validLocale] || selectedEntry.translation.en || selectedEntry.title;
  const title = `${entryTitle} - ${pageTitle} - ${text.nav?.pronunciation || fallbackText.nav?.pronunciation || 'Pronunciation'}`;
  const description = `${entryTitle}: ${baseDescription}`;
  
  return generateSEOMetadata({
    title,
    description,
    locale: validLocale,
    path: `/${validLocale}/pronunciation/${entry}`,
    keywords: ['Chinese pronunciation', entryTitle, 'pronunciation guides', 'Mandarin'],
    type: 'article',
  });
}

/**
 * Pronunciation Entry Page - Server Component
 * Displays a specific pronunciation entry
 */
export default async function PronunciationEntryPage({ params, searchParams }: PronunciationEntryPageProps) {
  const { locale, entry } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  
  const startTime = Date.now();
  
  // Fetch pronunciation entries
  const pronunciationEntries = await fetchPronunciationEntries({ language: validLocale });
  
  const text = await getUiText(validLocale);
  
  const duration = Date.now() - startTime;
  const logData = {
    type: 'other',
    action: 'pronunciationEntryPage',
    locale,
    entry,
    duration,
    entriesCount: pronunciationEntries.length,
    success: true,
  };
  console.log(JSON.stringify(logData));

  // Find selected entry
  const selectedEntry = pronunciationEntries.find(e => e.id === entry);
  
  // Special handling: if entry is pinyin-chart, redirect to the static page
  if (entry === 'pronunciation-pinyin-chart') {
    redirect(`/${validLocale}/pronunciation/pinyin-chart`);
  }
  
  if (!selectedEntry) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 py-6 sm:py-8 md:py-12 px-4 sm:px-6 md:px-8 w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
            {text.pronunciation?.title || 'Chinese Pronunciation'}
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            {text.pronunciation?.subtitle || 'Comprehensive Chinese pronunciation guides'}
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left column: Pronunciation Topics List */}
          <div className="lg:col-span-3">
            <div className="sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {text.pronunciation?.topics || 'Topics'}
              </h2>
              <Suspense fallback={<div className="mb-4 h-20 bg-gray-100 rounded-lg animate-pulse" />}>
                <PronunciationSearch />
              </Suspense>
              {pronunciationEntries.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  {text.pronunciation?.noResults || 'No pronunciation topics found'}
                </p>
              ) : (
                <Suspense fallback={<div className="space-y-2"><div className="h-12 bg-gray-100 rounded-lg animate-pulse" /><div className="h-12 bg-gray-100 rounded-lg animate-pulse" /></div>}>
                  <PronunciationTopicsList 
                    entries={pronunciationEntries} 
                    selectedEntryId={selectedEntry.id}
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Right column: Pronunciation Content */}
          <div className="lg:col-span-9">
            {selectedEntry ? (
              <ParagraphEntry entry={selectedEntry} />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {text.pronunciation?.noResults || 'No pronunciation topics found'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

