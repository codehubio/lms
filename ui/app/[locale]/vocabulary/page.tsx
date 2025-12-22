import { Suspense } from 'react';
import { fetchDictionaryEntries, fetchTagGroups } from '@/lib/data';
import VocabularyList from '@/components/VocabularyList';
import VocabularySearch from '@/components/VocabularySearch';
import VocabularyTagFilter from '@/components/VocabularyTagFilter';
import VocabularyPagination from '@/components/VocabularyPagination';
import { locales, type Locale, defaultLocale } from '@/proxy';
import { getUiText } from '@/lib/ui-text';
import { generateSEOMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

// Disable static generation - page needs database access
export const dynamic = 'force-dynamic';

interface VocabularyPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    tag?: string;
    view?: string;
  }>;
}

/**
 * Generate metadata for the vocabulary page with multilingual support
 */
export async function generateMetadata({ params }: VocabularyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  const text = await getUiText(validLocale);
  
  // Fallback to English if translation is missing
  const fallbackText = await getUiText('en');
  
  const pageTitle = text.dictionary?.title || fallbackText.dictionary?.title || 'Chinese Vocabulary Dictionary';
  const description = text.dictionary?.subtitle || fallbackText.dictionary?.subtitle || 'Comprehensive HSK vocabulary with pinyin, translations, and search functionality';
  const title = `${pageTitle} - ${text.nav?.dictionary || fallbackText.nav?.dictionary || 'Vocabulary'}`;
  
  return generateSEOMetadata({
    title,
    description,
    locale: validLocale,
    path: `/${validLocale}/vocabulary`,
    keywords: ['HSK vocabulary', 'Chinese dictionary', 'vocabulary search', 'Chinese words', 'pinyin'],
  });
}

/**
 * Vocabulary Page - Server Component
 * Fetches vocabulary entries on the server with pagination, search, and tag filtering
 */

export default async function VocabularyPage({ params, searchParams }: VocabularyPageProps) {
  const { locale } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  const searchParamsResolved = await searchParams;
  const page = parseInt(searchParamsResolved.page || '1', 10);
  const pageSize = parseInt(searchParamsResolved.pageSize || '50', 10);
  const search = searchParamsResolved.search || '';
  // Get view mode from URL params (default to 'card')
  const viewMode = (searchParamsResolved.view === 'table' ? 'table' : 'card') as 'card' | 'table';
  // Get all tag parameters (support multiple tags)
  const tags = searchParamsResolved.tag ? 
    (Array.isArray(searchParamsResolved.tag) ? searchParamsResolved.tag : [searchParamsResolved.tag]) :
    [];
  
  const startTime = Date.now();
  
  // Fetch tag groups and vocabulary entries in parallel
  // Don't include examples in card list mode for better performance
  const [tagGroups, result] = await Promise.all([
    fetchTagGroups(),
    fetchDictionaryEntries({ page, pageSize, search, tag: tags, language: validLocale, includeExamples: false })
  ]);
  
  const text = await getUiText(validLocale);
  
  const duration = Date.now() - startTime;
  const logData = {
    type: 'other',
    action: 'vocabularyPage',
    locale,
    page,
    pageSize,
    search,
    tags,
    duration,
    entriesCount: result.entries.length,
    total: result.total,
    totalPages: result.totalPages,
    success: true,
  };
  console.log(JSON.stringify(logData));

  // Create display text for no results message
  const filterText = search || tags.length > 0 
    ? (search || tags.join(', '))
    : '';

  // Build URLs for view toggle buttons (preserve all current params)
  const buildViewUrl = (view: 'card' | 'table') => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (pageSize !== 50) params.set('pageSize', pageSize.toString());
    if (search) params.set('search', search);
    tags.forEach(tag => params.append('tag', tag));
    if (view === 'table') params.set('view', 'table');
    // card is default, so we don't add view param for card
    const queryString = params.toString();
    return `/${validLocale}/vocabulary${queryString ? `?${queryString}` : ''}`;
  };

  const cardUrl = buildViewUrl('card');
  const tableUrl = buildViewUrl('table');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 py-6 sm:py-8 md:py-12 px-4 sm:px-6 md:px-8 w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
            {text.dictionary.title}
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            {text.dictionary.subtitle}
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Left column: Search and Tag Filters */}
          <div className="lg:col-span-3 order-1 lg:order-1">
            <div className="lg:sticky lg:top-6">
              <Suspense fallback={<div className="mb-4 sm:mb-6">{text.dictionary.loadingSearch}</div>}>
                <VocabularySearch />
              </Suspense>

              {/* Tag filter renders immediately with server-fetched data - no Suspense needed */}
              <VocabularyTagFilter tagGroups={tagGroups} />
            </div>
          </div>

          {/* Right column: Word List */}
          <div className="lg:col-span-9 order-2 lg:order-2">
            <div className="mb-6">
              <VocabularyPagination
                currentPage={result.page}
                totalPages={result.totalPages}
                total={result.total}
                pageSize={result.pageSize}
              />
            </div>

            {result.entries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {filterText
                    ? text.dictionary.noResultsMatching.replace('{search}', filterText)
                    : text.dictionary.noResults}
                </p>
              </div>
            ) : (
              <VocabularyList 
                entries={result.entries} 
                viewMode={viewMode} 
                locale={validLocale} 
                text={text}
                cardUrl={cardUrl}
                tableUrl={tableUrl}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

