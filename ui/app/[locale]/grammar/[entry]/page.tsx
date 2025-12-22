import Link from 'next/link';
import { fetchGrammarEntries } from '@/lib/data';
import GrammarEntry from '@/components/GrammarEntry';
import { locales, type Locale, defaultLocale } from '@/proxy';
import { getUiText } from '@/lib/ui-text';
import { generateSEOMetadata } from '@/lib/seo';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Disable static generation - page needs database access
export const dynamic = 'force-dynamic';

interface GrammarEntryPageProps {
  params: Promise<{ locale: string; entry: string }>;
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
export default async function GrammarEntryPage({ params }: GrammarEntryPageProps) {
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
              {grammarEntries.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  {text.grammar?.noResults || 'No grammar topics found'}
                </p>
              ) : (
                <div className="space-y-2">
                  {grammarEntries.map((entryItem) => {
                    const entryTitle = entryItem.translation[validLocale] || entryItem.translation.en || entryItem.title;
                    const isSelected = selectedEntry?.id === entryItem.id;
                    
                    return (
                      <Link
                        key={entryItem.id}
                        href={`/${validLocale}/grammar/${entryItem.id}`}
                        className={`block p-3 rounded-lg border transition ${
                          isSelected
                            ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {entryTitle}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Grammar Content */}
          <div className="lg:col-span-9">
            {selectedEntry ? (
              <GrammarEntry entry={selectedEntry} />
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

