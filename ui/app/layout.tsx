import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { generateSEOMetadata, getBaseUrl } from '@/lib/seo'
import { defaultLocale } from '@/proxy'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  ...generateSEOMetadata({
    title: 'Chinese Vocabulary Dictionary - HSK Word Lists | Learn Chinese',
    description: 'Master Chinese vocabulary with comprehensive HSK word lists, pinyin, translations, and grammar explanations. Search thousands of Chinese words with examples and stroke order animations.',
    locale: 'en',
    keywords: ['HSK vocabulary', 'Chinese learning', 'Mandarin dictionary'],
  }),
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
  category: 'education',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Root layout must have html and body tags for Next.js
  // This is required for metadata routes like sitemap to work properly
  // Default lang is set here, LocaleHtmlLang component will update it for locale routes
  // suppressHydrationWarning is needed because the locale layout script updates the lang attribute
  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}

