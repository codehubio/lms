import { Suspense } from 'react';
import PinyinChart from '@/components/PinyinChart';
import PronunciationSearch from '@/components/PronunciationSearch';
import PronunciationTopicsList from '@/components/PronunciationTopicsList';
import { fetchPronunciationEntries } from '@/lib/data';
import { locales, type Locale, defaultLocale } from '@/proxy';
import { getUiText } from '@/lib/ui-text';
import { generateSEOMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

// Disable static generation - page needs database access
export const dynamic = 'force-dynamic';

interface PinyinChartPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Generate metadata for the pinyin chart page with multilingual support
 */
export async function generateMetadata({ params }: PinyinChartPageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  const text = await getUiText(validLocale);
  
  // Fallback to English if translation is missing
  const fallbackText = await getUiText('en');
  
  const pageTitle = text.pronunciation?.title || fallbackText.pronunciation?.title || 'Chinese Pronunciation';
  const title = `Complete Pinyin Chart - ${pageTitle} - ${text.nav?.pronunciation || fallbackText.nav?.pronunciation || 'Pronunciation'}`;
  const description = 'Complete Pinyin pronunciation chart showing all valid combinations of initials and finals in Mandarin Chinese';
  
  return generateSEOMetadata({
    title,
    description,
    locale: validLocale,
    path: `/${validLocale}/pronunciation/pinyin-chart`,
    keywords: ['Chinese pronunciation', 'Pinyin chart', 'Pinyin table', 'Mandarin pronunciation', 'Chinese pinyin'],
  });
}

/**
 * Pinyin Chart Page - Server Component
 * Displays the complete Pinyin pronunciation chart
 */
export default async function PinyinChartPage({ params }: PinyinChartPageProps) {
  const { locale } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  
  const startTime = Date.now();
  
  // Fetch pronunciation entries for the sidebar
  const pronunciationEntries = await fetchPronunciationEntries({ language: validLocale });
  
  const text = await getUiText(validLocale);
  
  const duration = Date.now() - startTime;
  const logData = {
    type: 'other',
    action: 'pinyinChartPage',
    locale,
    duration,
    entriesCount: pronunciationEntries.length,
    success: true,
  };
  console.log(JSON.stringify(logData));

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
                    selectedEntryId="pronunciation-pinyin-chart"
                  />
                </Suspense>
              )}
            </div>
          </div>

          {/* Right column: Pinyin Chart Content */}
          <div className="lg:col-span-9">
            <PinyinChart locale={validLocale} />
          </div>
        </div>
      </main>
    </div>
  );
}

