import Hero from '@/components/Hero';
import HomeSections from '@/components/HomeSections';
import Footer from '@/components/Footer';
import { locales, type Locale, defaultLocale } from '@/proxy';
import { getUiText } from '@/lib/ui-text';
import type { Metadata } from 'next';

// Disable static generation - page needs database access
export const dynamic = 'force-dynamic';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Generate metadata for the home page with multilingual support
 */
export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  const text = await getUiText(validLocale);
  
  // Fallback to English if translation is missing
  const fallbackText = await getUiText('en');
  
  return {
    title: text.metadata?.title || fallbackText.metadata?.title || 'Chinese Vocabulary Dictionary',
    description: text.metadata?.description || fallbackText.metadata?.description || 'Master Chinese vocabulary with comprehensive HSK word lists, pinyin, and translations.',
    openGraph: {
      title: text.metadata?.title || fallbackText.metadata?.title || 'Chinese Vocabulary Dictionary',
      description: text.metadata?.description || fallbackText.metadata?.description || 'Master Chinese vocabulary with comprehensive HSK word lists, pinyin, and translations.',
      locale: validLocale,
    },
  };
}

/**
 * Server Component - runs on the server
 * Homepage with Vocabulary section
 */
export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;

  return (
    <div className="min-h-screen flex flex-col">
      <Hero locale={validLocale} />
      <HomeSections locale={validLocale} />
      <Footer locale={validLocale} />
    </div>
  );
}

