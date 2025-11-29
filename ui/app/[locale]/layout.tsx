import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import NavBar from '@/components/NavBar';
import { locales, type Locale, defaultLocale } from '@/middleware';
import { getUiText } from '@/lib/ui-text';
import '../globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-outfit',
});

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
      title,
      description,
      icons: {
        icon: '/icon.svg',
        shortcut: '/icon.svg',
        apple: '/icon.svg',
      },
      openGraph: {
        title,
        description,
        locale: validLocale,
      },
    };
  } catch (error) {
    // Fallback to English if there's an error
    return {
      title: 'Chinese Vocabulary Dictionary - HSK Word Lists',
      description: 'Master Chinese vocabulary with comprehensive HSK word lists, pinyin, and translations. Search and explore thousands of Chinese words.',
    };
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
  
  return (
    <html lang={validLocale} suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans`} suppressHydrationWarning>
        <NavBar />
        {children}
      </body>
    </html>
  );
}

