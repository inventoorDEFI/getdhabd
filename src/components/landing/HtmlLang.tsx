'use client'

import { useEffect } from 'react'
import { DIR, type Lang } from '@/lib/i18n'

/**
 * Syncs <html lang> and <html dir> with the page language.
 *
 * The root layout hardcodes lang="ar" dir="rtl", because a Next App Router
 * layout cannot read searchParams and language here is a query parameter. The
 * visual layout is already correct without this, since the page sets dir on its
 * own wrapper, but the document element would still claim Arabic and RTL on the
 * English page, which is wrong for assistive technology and for the browser's
 * own bidi handling of anything outside the wrapper.
 *
 * The design does the same thing in its own script. The real fix is route-based
 * locales (/ar, /en) rather than a query parameter, which is a larger change
 * than this branch should make. Noted in LANDING-NOTES.md.
 */
export function HtmlLang({ lang }: { lang: Lang }) {
  useEffect(() => {
    const el = document.documentElement
    el.lang = lang
    el.dir = DIR[lang]
  }, [lang])

  return null
}
