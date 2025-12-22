import type { Metadata } from 'next';
import NavBar from '@/components/NavBar';
import { locales, type Locale, defaultLocale } from '@/proxy';
import { getUiText } from '@/lib/ui-text';
import { generateSEOMetadata } from '@/lib/seo';

/**
 * Generate metadata for the locale layout with multilingual support
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  
  try {
    const text = await getUiText(validLocale);
    const fallbackText = await getUiText('en');
    
    const title = text.metadata?.title || fallbackText.metadata?.title || 'Chinese Vocabulary Dictionary - HSK Word Lists';
    const description = text.metadata?.description || fallbackText.metadata?.description || 'Master Chinese vocabulary with comprehensive HSK word lists, pinyin, and translations. Search and explore thousands of Chinese words.';
    
    return {
      ...generateSEOMetadata({
        title,
        description,
        locale: validLocale,
        path: `/${validLocale}`,
        keywords: ['HSK vocabulary', 'Chinese learning', 'Mandarin dictionary'],
      }),
      icons: {
        icon: '/icon.svg',
        shortcut: '/icon.svg',
        apple: '/icon.svg',
      },
    };
  } catch (error) {
    // Fallback to English if there's an error
    return generateSEOMetadata({
      title: 'Chinese Vocabulary Dictionary - HSK Word Lists',
      description: 'Master Chinese vocabulary with comprehensive HSK word lists, pinyin, and translations. Search and explore thousands of Chinese words.',
      locale: validLocale,
      path: `/${validLocale}`,
    });
  }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale: Locale = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  
  // Nested layout should not have html/body tags
  // The root layout provides those
  // We use an inline script to set the lang attribute immediately
  return (
    <>
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `if(typeof document!=='undefined'){document.documentElement.setAttribute('lang','${validLocale}');}`,
        }}
      />
      <NavBar />
      {children}
    </>
  );
}

