import type { Metadata, Viewport } from 'next'
import { BRAND } from '@/lib/brand'
import { T } from '@/lib/i18n'
import './globals.css'

const SITE = 'https://getdhabd.com'
const TITLE_AR = `${BRAND.nameAr} · ${T.productTagline.ar}`
const DESC_AR =
  'افحص تصميمك قبل التقديم على بلدي. ضبط يطابق مخططاتك مع اشتراطات البناء السكني وكود البناء السعودي، ويعطيك تقريرًا واضحًا بكل ملاحظة.'
const DESC_EN =
  'Check your design before submitting to Balady. Dhabt matches your drawings against the residential building requirements and the Saudi Building Code, and reports every issue clearly.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE_AR,
  description: DESC_AR,
  alternates: {
    canonical: '/',
    languages: { ar: '/', en: '/?lang=en' },
  },
  openGraph: {
    type: 'website',
    url: SITE,
    siteName: BRAND.nameAr,
    locale: 'ar_SA',
    alternateLocale: 'en_US',
    title: TITLE_AR,
    description: DESC_AR,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE_AR,
    description: `${DESC_AR} · ${DESC_EN}`,
  },
  /**
   * Not indexable while the corpus is fixture data.
   *
   * Must live inside `metadata`. A standalone `export const robots` is not a
   * Next.js metadata export and emits nothing, which is how this shipped
   * unprotected the first time.
   *
   * Delete this the day a verified, licensed corpus is loaded.
   */
  robots: { index: false, follow: false },
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
