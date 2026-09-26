import Link from 'next/link'
import { Chrome, langFrom } from '@/components/Chrome'
import { Lockup, Symbol } from '@/components/Logo'
import { checkName, t, type Lang } from '@/lib/i18n'
import { getDemoReport } from '@/lib/demo/corpus'

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const lang = langFrom(await searchParams)
  const report = await getDemoReport()
  const q = lang === 'en' ? '?lang=en' : ''

  const checks = [...new Set(report.groundableRules.map((r) => r.ruleKey))].sort()

  return (
    <Chrome lang={lang} current="home">
      {/* ================= hero, the one dark section ================= */}
      <section className="relative -mx-6 overflow-hidden bg-ink px-6 text-on-ink">
        <SheetGrid />
        {/* The symbol used once, large and very faint, as a sheet watermark */}
        <Symbol
          size={520}
          className="pointer-events-none absolute -bottom-32 start-[-90px] text-white/[0.035]"
        />

        <div className="relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="grid gap-7">
            <Lockup height={46} className="text-on-ink" />

            <h1 className="max-w-[20ch] text-[clamp(28px,4.6vw,44px)] leading-[1.32] font-semibold tracking-tight text-balance">
              {t('heroLine', lang)}
            </h1>

            <p className="max-w-[54ch] text-[16px] leading-[1.9] text-muted-on-ink">
              {t('heroSupport', lang)}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-x-7 gap-y-3">
              <Link
                href={`/app${q}`}
                className="rounded bg-on-ink px-6 py-3 text-[15px] font-semibold text-ink hover:opacity-90"
              >
                {t('ctaPrimary', lang)}
              </Link>
              <a
                href="#how"
                className="border-b border-white/30 pb-0.5 text-[14px] text-muted-on-ink hover:border-white/70 hover:text-on-ink"
              >
                {t('ctaHow', lang)}
              </a>
            </div>
          </div>

          <FacadeDrawing lang={lang} />
        </div>
      </section>

      {/* ================= 01 the problem ================= */}
      <Sheet n="01" title={t('problemTitle', lang)}>
        <div className="grid max-w-[68ch] gap-4 text-[15px] leading-[1.95] text-slate">
          <p>{t('problemP1', lang)}</p>
          <p>{t('problemP2', lang)}</p>
          <p>{t('problemP3', lang)}</p>
        </div>
      </Sheet>

      {/* ================= 02 how it works ================= */}
      <Sheet n="02" title={t('howTitle', lang)} id="how">
        <ol className="grid border-t border-rule sm:grid-cols-2 lg:grid-cols-4">
          {[
            [t('how1T', lang), t('how1B', lang)],
            [t('how2T', lang), t('how2B', lang)],
            [t('how3T', lang), t('how3B', lang)],
            [t('how4T', lang), t('how4B', lang)],
          ].map(([head, body], i) => (
            <li
              key={head}
              className="border-b border-rule py-6 pe-6 sm:border-e sm:last:border-e-0 lg:pe-7"
            >
              <span className="mono mb-3 block text-[12px] tracking-[0.1em] text-slate">
                {`0${i + 1}`}
              </span>
              <h3 className="mb-2 text-[15px] font-semibold">{head}</h3>
              <p className="text-[13.5px] leading-[1.75] text-slate">{body}</p>
            </li>
          ))}
        </ol>
      </Sheet>

      {/* ================= 03 what it checks ================= */}
      <Sheet n="03" title={lang === 'ar' ? 'ما يفحصه اليوم' : 'What it checks today'}>
        <ul className="grid gap-x-8 gap-y-0 border-t border-rule sm:grid-cols-2 lg:grid-cols-3">
          {checks.map((key) => (
            <li
              key={key}
              className="flex items-center gap-3 border-b border-rule py-3 text-[14px]"
            >
              <Symbol size={13} className="shrink-0 text-ink" />
              {checkName(key, lang)}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[13.5px] text-slate">
          {lang === 'ar'
            ? 'الفلل السكنية أولًا، وهي أعلى أنواع الرخص عددًا وأبسطها هندسة.'
            : 'Residential villas first: the highest permit volume and the simplest geometry.'}
        </p>
      </Sheet>

      {/* ================= 04 why ================= */}
      <Sheet n="04" title={t('whyTitle', lang)}>
        <p className="max-w-[66ch] text-[15px] leading-[1.95] text-slate">{t('whyBody', lang)}</p>
      </Sheet>

      {/* ================= 05 who ================= */}
      <Sheet n="05" title={t('whoTitle', lang)}>
        <ul className="grid max-w-[66ch] border-t border-rule">
          {[t('who1', lang), t('who2', lang)].map((line) => (
            <li key={line} className="border-b border-rule py-4 text-[15px] leading-[1.8]">
              {line}
            </li>
          ))}
        </ul>
      </Sheet>

      {/* ================= 06 coming soon ================= */}
      <Sheet n="06" title={t('soonTitle', lang)} label={t('soonLabel', lang)}>
        <p className="max-w-[68ch] text-[15px] leading-[1.95] text-slate">{t('soonBody', lang)}</p>
        <p className="mt-4 max-w-[68ch] border-s-2 border-ink ps-4 text-[14px] leading-[1.85]">
          {t('soonNote', lang)}
        </p>
      </Sheet>

      {/* ================= 07 boundaries ================= */}
      <Sheet n="07" title={t('notTitle', lang)}>
        <ul className="grid max-w-[68ch] border-t border-rule">
          {[t('not1', lang), t('not2', lang), t('not3', lang)].map((line) => (
            <li
              key={line}
              className="border-b border-rule py-4 text-[14.5px] leading-[1.85] text-slate"
            >
              {line}
            </li>
          ))}
        </ul>
      </Sheet>

      {/* ================= status ================= */}
      <section className="mt-16 border border-rule bg-wash px-6 py-6">
        <p className="mono mb-2 text-[11px] tracking-[0.12em] text-slate uppercase">
          {t('statusTitle', lang)}
        </p>
        <p className="max-w-[66ch] text-[14px] leading-[1.85] text-slate">
          {t('statusBody', lang)}
        </p>
      </section>

      {/* ================= close ================= */}
      <section className="mt-16 border-t-2 border-ink pt-10 pb-4">
        <h2 className="text-[clamp(22px,3vw,30px)] font-semibold tracking-tight">
          {t('closeTitle', lang)}
        </h2>
        <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3">
          <Link
            href={`/app${q}`}
            className="rounded bg-ink px-6 py-3 text-[15px] font-semibold text-on-ink hover:opacity-90"
          >
            {t('ctaPrimary', lang)}
          </Link>
          <Link
            href={`/reports/demo${q}`}
            className="border-b border-rule pb-0.5 text-[14px] text-slate hover:border-ink hover:text-ink"
          >
            {t('seeSampleShort', lang)}
          </Link>
        </div>
      </section>
    </Chrome>
  )
}

/**
 * A numbered sheet section.
 *
 * The number is not decoration: these are read in order, and a drawing set
 * numbers its sheets. The rule above each one is the sheet edge.
 */
function Sheet({
  n,
  title,
  label,
  id,
  children,
}: {
  n: string
  title: string
  label?: string
  id?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mt-16 scroll-mt-20">
      <div className="mb-6 flex items-baseline gap-4 border-b-2 border-ink pb-3">
        <span className="mono text-[12px] tracking-[0.1em] text-slate">{n}</span>
        <h2 className="text-[clamp(19px,2.3vw,24px)] font-semibold tracking-tight text-balance">
          {title}
        </h2>
        {label ? (
          <span className="mono ms-auto shrink-0 border border-rule px-2 py-0.5 text-[10.5px] tracking-[0.08em] text-slate uppercase">
            {label}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/** The sheet ruling behind the dark hero. Decorative only. */
function SheetGrid() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div className="drafting-grid absolute inset-0" />
      <div className="absolute inset-y-0 end-6 w-px bg-white/10 sm:end-10" />
      <div className="absolute inset-x-0 top-6 h-px bg-white/10" />
    </div>
  )
}

/**
 * A generic villa elevation with a measurement overlay.
 *
 * The brief asked for a facade with an opening-ratio check. Dhabt does not check
 * facades, so the overlay measures something it does check: the height limit and
 * the floor count, read off a section. The building is abstract and is not any
 * real building.
 *
 * Ink and slate only, no fills beyond flat tone, so it reads as a drawing rather
 * than an illustration.
 */
function FacadeDrawing({ lang }: { lang: Lang }) {
  const ar = lang === 'ar'
  const L = ar
    ? { h: 'الارتفاع', limit: 'الحد ١٢٫٠٠ م', g: 'أرضي', f: 'أول', a: 'ملحق', street: 'منسوب الشارع' }
    : { h: 'Height', limit: 'Limit 12.00 m', g: 'Ground', f: 'First', a: 'Annex', street: 'Street level' }

  return (
    <figure className="m-0 border border-white/15 bg-white/[0.03] p-5">
      <svg viewBox="0 0 420 330" className="h-auto w-full" role="img"
           aria-label={ar ? 'رسم توضيحي لواجهة فيلا مع فحص الارتفاع' : 'Villa elevation with a height check'}>
        <g stroke="#C9CCD0" strokeWidth="1.2" fill="none">
          {/* massing: ground, first, annex */}
          <rect x="92" y="196" width="230" height="86" />
          <rect x="92" y="112" width="230" height="84" />
          <rect x="150" y="56" width="114" height="56" />
          {/* openings */}
          <rect x="116" y="220" width="34" height="42" />
          <rect x="166" y="220" width="34" height="42" />
          <rect x="248" y="214" width="54" height="48" />
          <rect x="116" y="136" width="34" height="38" />
          <rect x="166" y="136" width="34" height="38" />
          <rect x="216" y="136" width="34" height="38" />
          <rect x="266" y="136" width="34" height="38" />
          <rect x="176" y="76" width="62" height="24" />
        </g>

        {/* ground line */}
        <line x1="56" y1="282" x2="372" y2="282" stroke="#C9CCD0" strokeWidth="2" />
        <text x="214" y="300" fontSize="11" textAnchor="middle" fill="#5B6169"
              fontFamily="var(--font-ar)">{L.street}</text>

        {/* the measured dimension, in white so it reads as the overlay */}
        <g stroke="#FFFFFF" strokeWidth="1.3" fill="none">
          <line x1="56" y1="56" x2="56" y2="282" />
          <path d="M 52 60 L 56 56 L 60 60" />
          <path d="M 52 278 L 56 282 L 60 278" />
          <line x1="48" y1="56" x2="92" y2="56" strokeDasharray="4 3" strokeWidth="1" />
        </g>
        <text x="66" y="150" fontSize="12" fill="#FFFFFF" fontFamily="var(--font-ar)">{L.h}</text>
        <text x="66" y="168" fontSize="12" fill="#FFFFFF" fontFamily="var(--font-mo)">11.20</text>
        <text x="66" y="186" fontSize="10.5" fill="#C9CCD0" fontFamily="var(--font-ar)">{L.limit}</text>

        {/* floor labels */}
        {[[239, L.g], [155, L.f], [90, L.a]].map(([y, label]) => (
          <text key={String(label)} x="340" y={y as number} fontSize="10.5" fill="#5B6169"
                fontFamily="var(--font-ar)">{label as string}</text>
        ))}
      </svg>
    </figure>
  )
}
