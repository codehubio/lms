import { locales, type Locale, defaultLocale } from '@/proxy';
import { getUiText } from '@/lib/ui-text';
import { generateSEOMetadata } from '@/lib/seo';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

// Disable static generation - page needs dynamic content
export const dynamic = 'force-dynamic';

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Generate metadata for the about page with multilingual support
 */
export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  const text = await getUiText(validLocale);
  
  // Fallback to English if translation is missing
  const fallbackText = await getUiText('en');
  
  const pageTitle = text.about?.title || fallbackText.about?.title || 'About';
  const description = text.about?.description || fallbackText.about?.description || 'Learn about the Chinese Vocabulary Dictionary';
  const title = `${pageTitle} - ${text.nav?.brand || fallbackText.nav?.brand || 'Chinese Vocabulary'}`;
  
  return generateSEOMetadata({
    title,
    description,
    locale: validLocale,
    path: `/${validLocale}/about`,
    keywords: ['about', 'Chinese learning', 'vocabulary dictionary'],
  });
}

/**
 * About Page - Server Component
 * Displays information about the Chinese Vocabulary Dictionary
 */
export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  const text = await getUiText(validLocale);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
            {text.about.title}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            {text.about.description}
          </p>
        </div>

        {/* Features Section */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
            {text.about.features}
          </h2>
          <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label={text.about.feature1Title || 'Comprehensive HSK Vocabulary'} role="img">
                  <title>{text.about.feature1Title || 'Comprehensive HSK Vocabulary'}</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {text.about.feature1Title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {text.about.feature1Description}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label={text.about.feature2Title || 'Pinyin & Translations'} role="img">
                  <title>{text.about.feature2Title || 'Pinyin & Translations'}</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {text.about.feature2Title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {text.about.feature2Description}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label={text.about.feature3Title || 'Powerful Search'} role="img">
                  <title>{text.about.feature3Title || 'Powerful Search'}</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {text.about.feature3Title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {text.about.feature3Description}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label={text.about.feature4Title || 'Bilingual Interface'} role="img">
                  <title>{text.about.feature4Title || 'Bilingual Interface'}</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {text.about.feature4Title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {text.about.feature4Description}
              </p>
            </div>

            {/* Feature 5 - Grammar */}
            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label={text.about.feature5Title || 'Grammar Guide'} role="img">
                  <title>{text.about.feature5Title || 'Grammar Guide'}</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {text.about.feature5Title || 'Chinese Grammar'}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {text.about.feature5Description || 'Comprehensive grammar explanations with examples and markdown support'}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer locale={validLocale} />
    </div>
  );
}

