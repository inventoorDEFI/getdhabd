import type { Metadata, Viewport } from 'next'
import { BRAND } from '@/lib/brand'
import { T } from '@/lib/i18n'
import './globals.css'

export const metadata: Metadata = {
  title: `${BRAND.nameAr} · ${T.productTagline.ar}`,
  description: BRAND.descriptionAr,
  icons: {
    icon: [
      { url: '/brand/dhabt-favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/brand/apple-touch-icon-180.png',
  },
}

export const viewport: Viewport = { themeColor: '#15181C' }

/**
 * Not indexable yet.
 *
 * Every clause currently loaded is invented fixture data. The pages badge it as
 * FIXTURE, but a Saudi engineer arriving from a search result at a polished
 * Arabic compliance report may not read the badge. For a product whose thesis is
 * "never state a requirement we cannot source", being findable while the corpus
 * is synthetic is the one failure mode everything else here prevents.
 *
 * Delete this export the day a verified, licensed corpus is loaded.
 */
export const robots = { index: false, follow: false }

/**
 * Arabic and RTL are the document default, set on <html> rather than applied to
 * a wrapper. A page opts into English, not out of it.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
