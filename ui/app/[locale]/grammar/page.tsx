import { fetchGrammarEntries } from '@/lib/data';
import { locales, type Locale, defaultLocale } from '@/proxy';
import { getUiText } from '@/lib/ui-text';
import { generateSEOMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// Disable static generation - page needs database access
export const dynamic = 'force-dynamic';

interface GrammarPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    entry?: string;
  }>;
}

/**
 * Generate metadata for the grammar page with multilingual support
 */
export async function generateMetadata({ params }: GrammarPageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  const text = await getUiText(validLocale);
  
  // Fallback to English if translation is missing
  const fallbackText = await getUiText('en');
  
  const pageTitle = text.grammar?.title || fallbackText.grammar?.title || 'Chinese Grammar';
  const description = text.grammar?.subtitle || fallbackText.grammar?.subtitle || 'Comprehensive Chinese grammar explanations';
  const title = `${pageTitle} - ${text.nav?.grammar || fallbackText.nav?.grammar || 'Grammar'}`;
  
  return generateSEOMetadata({
    title,
    description,
    locale: validLocale,
    path: `/${validLocale}/grammar`,
    keywords: ['Chinese grammar', 'grammar explanations', 'Mandarin grammar', 'Chinese language'],
  });
}

/**
 * Grammar Page - Server Component
 * Redirects to the first grammar entry or the specified entry from query params
 */
export default async function GrammarPage({ params, searchParams }: GrammarPageProps) {
  const { locale } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  const searchParamsResolved = await searchParams;
  const entryId = searchParamsResolved.entry;
  
  const startTime = Date.now();
  
  // Fetch grammar entries
  const grammarEntries = await fetchGrammarEntries({ language: validLocale });
  
  const duration = Date.now() - startTime;
  const logData = {
    type: 'other',
    action: 'grammarPage',
    locale,
    duration,
    entriesCount: grammarEntries.length,
    success: true,
  };
  console.log(JSON.stringify(logData));

  // If entry is specified in query params (old format), redirect to new path format
  if (entryId) {
    const entry = grammarEntries.find(e => e.id === entryId);
    if (entry) {
      redirect(`/${validLocale}/grammar/${entryId}`);
    }
  }

  // Redirect to the first entry if available
  if (grammarEntries.length > 0) {
    redirect(`/${validLocale}/grammar/${grammarEntries[0].id}`);
  }

  // If no entries, show empty state (shouldn't happen, but handle gracefully)
  const text = await getUiText(validLocale);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 py-6 sm:py-8 md:py-12 px-4 sm:px-6 md:px-8 w-full">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
            {text.grammar?.title || 'Chinese Grammar'}
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            {text.grammar?.subtitle || 'Comprehensive Chinese grammar explanations'}
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">
            {text.grammar?.noResults || 'No grammar topics found'}
          </p>
        </div>
      </main>
    </div>
  );
}

