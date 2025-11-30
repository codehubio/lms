import type { Metadata } from 'next'
import './globals.css'

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
  // Root layout just passes through - locale layout provides html/body
  return children
}

