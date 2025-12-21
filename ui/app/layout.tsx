import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'Chinese LMS',
  description: 'Master Chinese with interactive lessons and immersive content.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Root layout must have html and body tags for Next.js
  // This is required for metadata routes like sitemap to work properly
  return (
    <html>
      <body className={`${outfit.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}

