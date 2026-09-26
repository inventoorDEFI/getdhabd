import Link from 'next/link'
import { Lockup } from '@/components/Logo'
import { DIR, t, type Lang } from '@/lib/i18n'

/**
 * Page shell. Takes lang and flips the document direction with it, so English is
 * a first class layout rather than a mirrored afterthought.
 */
export function Chrome({
  lang,
  current,
  children,
}: {
  lang: Lang
  current: 'home' | 'review' | 'corpus' | 'report'
  children: React.ReactNode
}) {
  const q = lang === 'en' ? '?lang=en' : ''
  const other: Lang = lang === 'ar' ? 'en' : 'ar'
  const otherQ = other === 'en' ? '?lang=en' : ''

  const nav = [
    { key: 'review' as const, href: `/review${q}`, label: t('navReview', lang) },
    { key: 'corpus' as const, href: `/corpus${q}`, label: t('navCorpus', lang) },
    { key: 'report' as const, href: `/reports/demo${q}`, label: t('navReport', lang) },
  ]

  return (
    <div dir={DIR[lang]} lang={lang} className={lang === 'ar' ? 'font-[family-name:var(--font-ar)]' : 'font-[family-name:var(--font-la)]'}>
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-7 gap-y-3 px-6 py-3.5">
          <Link href={`/${q}`} className="shrink-0" aria-label="ضبط">
            <Lockup height={26} />
          </Link>
          <nav className="flex gap-5 text-[13.5px]">
            {nav.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                aria-current={current === item.key ? 'page' : undefined}
                className={
                  current === item.key
                    ? 'border-b-2 border-ink pb-0.5 font-medium text-ink'
                    : 'pb-0.5 text-muted hover:text-ink'
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href={`${
              current === 'home'
                ? '/'
                : current === 'review'
                  ? '/review'
                  : current === 'corpus'
                    ? '/corpus'
                    : '/reports/demo'
            }${otherQ}`}
            className="mono ms-auto rounded border border-line px-2.5 py-1 text-[11px] text-muted hover:border-line-strong hover:text-ink"
          >
            {t('langSwitch', lang)}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 pb-24">{children}</main>
      <footer className="mx-auto max-w-5xl px-6 pb-10">
        <div className="mono flex flex-wrap justify-between gap-4 border-t border-line pt-4 text-[11px] text-muted">
          <span>{t('productTagline', lang)}</span>
          <span className="latin">v0.1 · step 1 of 5</span>
        </div>
      </footer>
    </div>
  )
}

/** Reads ?lang=en, defaulting to Arabic. */
export function langFrom(params: { lang?: string | string[] } | undefined): Lang {
  const raw = Array.isArray(params?.lang) ? params?.lang[0] : params?.lang
  return raw === 'en' ? 'en' : 'ar'
}
