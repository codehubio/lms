import type { Metadata } from 'next';
import { locales, type Locale, defaultLocale } from '@/proxy';

/**
 * Get base URL from environment variables
 */
export function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'https://lms.codehub.io'
  );
}

/**
 * Generate comprehensive SEO metadata
 */
export function generateSEOMetadata({
  title,
  description,
  locale = 'en',
  path = '',
  keywords,
  image,
  type = 'website',
}: {
  title: string;
  description: string;
  locale?: string;
  path?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article';
}): Metadata {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;
  const siteName = 'Chinese Vocabulary Dictionary - HSK Word Lists';
  
  // Default keywords if not provided
  const defaultKeywords = [
    'Chinese vocabulary',
    'HSK',
    'Chinese dictionary',
    'learn Chinese',
    'Chinese words',
    'pinyin',
    'Chinese grammar',
    'Mandarin',
    'Chinese language learning',
  ];
  
  const allKeywords = keywords ? [...defaultKeywords, ...keywords] : defaultKeywords;
  
  // Default image if not provided
  const ogImage = image || `${baseUrl}/icon.svg`;
  
  // Generate alternate language URLs
  const alternates: Metadata['alternates'] = {
    canonical: url,
    languages: Object.fromEntries(
      locales.map((loc) => {
        const localePath = path.startsWith(`/${loc}/`) 
          ? path 
          : path.startsWith('/') 
            ? `/${loc}${path}` 
            : `/${loc}/${path}`;
        return [loc, `${baseUrl}${localePath}`];
      })
    ),
  };

  return {
    title,
    description,
    keywords: allKeywords.join(', '),
    authors: [{ name: 'Chinese LMS' }],
    creator: 'Chinese LMS',
    publisher: 'Chinese LMS',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates,
    openGraph: {
      type,
      locale: locale,
      url,
      title,
      description,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@chineselms', // Update with your Twitter handle if available
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      // Add your verification codes here when available
      // google: 'your-google-verification-code',
      // yandex: 'your-yandex-verification-code',
      // yahoo: 'your-yahoo-verification-code',
    },
  };
}

