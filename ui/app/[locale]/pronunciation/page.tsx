import { fetchPronunciationEntries } from '@/lib/data';
import { locales, type Locale, defaultLocale } from '@/proxy';
import { getUiText } from '@/lib/ui-text';
import { generateSEOMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Disable static generation - page needs database access
export const dynamic = 'force-dynamic';

interface PronunciationPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    entry?: string;
  }>;
}

/**
 * Generate metadata for the pronunciation page with multilingual support
 */
export async function generateMetadata({ params }: PronunciationPageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  const text = await getUiText(validLocale);
  
  // Fallback to English if translation is missing
  const fallbackText = await getUiText('en');
  
  const pageTitle = text.pronunciation?.title || fallbackText.pronunciation?.title || 'Chinese Pronunciation';
  const description = text.pronunciation?.subtitle || fallbackText.pronunciation?.subtitle || 'Comprehensive Chinese pronunciation guides';
  const title = `${pageTitle} - ${text.nav?.pronunciation || fallbackText.nav?.pronunciation || 'Pronunciation'}`;
  
  return generateSEOMetadata({
    title,
    description,
    locale: validLocale,
    path: `/${validLocale}/pronunciation`,
    keywords: ['Chinese pronunciation', 'pronunciation guides', 'Mandarin pronunciation', 'Chinese language'],
  });
}

/**
 * Pronunciation Page - Server Component
 * Redirects to the first pronunciation entry or the specified entry from query params
 */
export default async function PronunciationPage({ params, searchParams }: PronunciationPageProps) {
  const { locale } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  const searchParamsResolved = await searchParams;
  const entryId = searchParamsResolved.entry;
  
  const startTime = Date.now();
  
  // Fetch pronunciation entries
  const pronunciationEntries = await fetchPronunciationEntries({ language: validLocale });
  
  const duration = Date.now() - startTime;
  const logData = {
    type: 'other',
    action: 'pronunciationPage',
    locale,
    duration,
    entriesCount: pronunciationEntries.length,
    success: true,
  };
  console.log(JSON.stringify(logData));

  // If entry is specified in query params (old format), redirect to new path format
  if (entryId) {
    const entry = pronunciationEntries.find(e => e.id === entryId);
    if (entry) {
      // Special handling for pinyin-chart
      if (entry.id === 'pronunciation-pinyin-chart') {
        redirect(`/${validLocale}/pronunciation/pinyin-chart`);
      } else {
        redirect(`/${validLocale}/pronunciation/${entryId}`);
      }
    }
  }

  // Redirect to the first entry if available
  if (pronunciationEntries.length > 0) {
    const firstEntry = pronunciationEntries[0];
    // Special handling for pinyin-chart
    if (firstEntry.id === 'pronunciation-pinyin-chart') {
      redirect(`/${validLocale}/pronunciation/pinyin-chart`);
    } else {
      redirect(`/${validLocale}/pronunciation/${firstEntry.id}`);
    }
  }

  // If no entries, show empty state (shouldn't happen, but handle gracefully)
  const text = await getUiText(validLocale);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 py-6 sm:py-8 md:py-12 px-4 sm:px-6 md:px-8 w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
            {text.pronunciation?.title || 'Chinese Pronunciation'}
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            {text.pronunciation?.subtitle || 'Comprehensive Chinese pronunciation guides'}
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">
            {text.pronunciation?.noResults || 'No pronunciation topics found'}
          </p>
        </div>
      </main>
    </div>
  );
}

