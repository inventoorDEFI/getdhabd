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

  const checks = [...report.groundableRules]
    .map((r) => r.ruleKey)
    .filter((k, i, a) => a.indexOf(k) === i)
    .sort()

  return (
    <Chrome lang={lang} current="home">
      {/* ---------------- hero ---------------- */}
      <section className="relative -mx-6 overflow-hidden bg-ink px-6 text-on-ink">
        <div className="drafting-grid absolute inset-0" aria-hidden="true" />
        {/* A drawn margin rule, as a sheet has */}
        <div className="absolute inset-y-0 end-6 w-px bg-white/10 sm:end-10" aria-hidden="true" />

        <div className="relative grid items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="grid gap-6">
            <Lockup height={44} className="text-on-ink" />

            <p className="flex items-center gap-2.5 font-[family-name:var(--font-mo)] text-[11.5px] tracking-[0.12em] text-accent-on-ink uppercase">
              {t('heroKicker', lang)}
            </p>

            <h1 className="max-w-[17ch] text-[clamp(32px,5.4vw,52px)] leading-[1.2] font-semibold tracking-tight text-balance">
              {t('heroTitle', lang)}
            </h1>

            <p className="max-w-[52ch] text-[16px] leading-[1.85] text-muted-on-ink">
              {t('heroSub', lang)}
            </p>

            <div className="mt-2 flex flex-wrap gap-3">
              <Link
                href={`/reports/demo${q}`}
                className="rounded bg-on-ink px-5 py-3 text-[14.5px] font-semibold text-ink hover:opacity-90"
              >
                {t('ctaPrimary', lang)}
              </Link>
              <Link
                href={`/review${q}`}
                className="rounded border border-white/25 px-5 py-3 text-[14.5px] font-medium text-on-ink hover:border-white/60"
              >
                {t('ctaSecondary', lang)}
              </Link>
            </div>
          </div>

          <PlotDiagram lang={lang} />
        </div>
      </section>

      {/* ---------------- problem ---------------- */}
      <Section eyebrow="01" title={t('problemTitle', lang)}>
        <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          {[
            [t('problem1T', lang), t('problem1B', lang)],
            [t('problem2T', lang), t('problem2B', lang)],
            [t('problem3T', lang), t('problem3B', lang)],
          ].map(([head, body]) => (
            <div key={head} className="bg-card px-5 py-5">
              <h3 className="mb-1.5 text-[14.5px] font-semibold">{head}</h3>
              <p className="text-[13.5px] leading-[1.7] text-muted">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------- the promise: the whole argument ---------------- */}
      <section className="relative mt-20 overflow-hidden rounded-xl border border-accent-line bg-accent-soft">
        <div className="drafting-grid-light absolute inset-0" aria-hidden="true" />
        <div className="relative grid gap-8 px-7 py-9 lg:grid-cols-[1fr_1fr] lg:gap-12">
          <div>
            <p className="eyebrow mb-2.5">02</p>
            <h2 className="mb-3 max-w-[20ch] text-[clamp(22px,2.6vw,28px)] leading-[1.3] font-semibold tracking-tight text-balance">
              {t('promiseTitle', lang)}
            </h2>
            <p className="max-w-[48ch] text-[14.5px] leading-[1.85] text-muted">
              {t('promiseBody', lang)}
            </p>
            <ul className="mt-6 grid gap-3.5">
              {[
                [t('promise1T', lang), t('promise1B', lang)],
                [t('promise2T', lang), t('promise2B', lang)],
                [t('promise3T', lang), t('promise3B', lang)],
              ].map(([head, body]) => (
                <li key={head} className="flex gap-3">
                  <Symbol size={15} className="mt-1 shrink-0 text-accent" />
                  <span>
                    <b className="text-[13.5px] font-semibold text-ink">{head}</b>
                    <span className="block text-[13px] leading-[1.6] text-muted">{body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* A real report row, rendered from the same objects the report page uses */}
          <ReportPreview lang={lang} />
        </div>
      </section>

      {/* ---------------- how ---------------- */}
      <Section eyebrow="03" title={t('howTitle', lang)}>
        <ol className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            [t('how1T', lang), t('how1B', lang)],
            [t('how2T', lang), t('how2B', lang)],
            [t('how3T', lang), t('how3B', lang)],
            [t('how4T', lang), t('how4B', lang)],
          ].map(([head, body], i) => (
            <li key={head} className="bg-card px-5 py-5">
              {/* Numbered because these are sequential stages, not a list of features */}
              <span className="mono mb-2.5 block text-[13px] font-medium text-accent">{`0${i + 1}`}</span>
              <h3 className="mb-1.5 text-[14.5px] font-semibold">{head}</h3>
              <p className="text-[13px] leading-[1.7] text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------------- checks ---------------- */}
      <Section eyebrow="04" title={t('checksTitle', lang)} sub={t('checksSub', lang)}>
        <div className="flex flex-wrap gap-2">
          {checks.map((key) => (
            <span
              key={key}
              className="rounded-full border border-line bg-card px-3.5 py-1.5 text-[13px] hover:border-accent-line hover:text-accent"
            >
              {checkName(key, lang)}
            </span>
          ))}
        </div>
      </Section>

      {/* ---------------- sources ---------------- */}
      <Section eyebrow="05" title={t('sourcesTitle', lang)}>
        <p className="max-w-[68ch] text-[14.5px] leading-[1.85] text-muted">
          {t('sourcesBody', lang)}
        </p>
      </Section>

      {/* ---------------- status ---------------- */}
      <section className="mt-20 rounded-lg border border-nc-line bg-nc-bg px-6 py-6">
        <p className="eyebrow mb-2">06</p>
        <h2 className="mb-2 text-[17px] font-semibold">{t('statusTitle', lang)}</h2>
        <p className="max-w-[64ch] text-[14px] leading-[1.8] text-nc-fg">{t('statusBody', lang)}</p>
      </section>
    </Chrome>
  )
}

function Section({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow: string
  title: string
  sub?: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-20">
      {/* The eyebrow numbers the sheet, the way a title block does */}
      <p className="eyebrow mb-2.5">{eyebrow}</p>
      <h2 className="max-w-[24ch] text-[clamp(22px,2.6vw,28px)] leading-[1.3] font-semibold tracking-tight text-balance">
        {title}
      </h2>
      {sub ? <p className="mt-2 max-w-[60ch] text-[14.5px] text-muted">{sub}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  )
}

/**
 * A villa plot with its setbacks.
 *
 * The same figure the logo abstracts: boundary lines with a footprint between
 * them. Three distinct things, because conflating them is the mistake the
 * drawing exists to prevent: the plot, the buildable envelope the setbacks
 * leave, and the actual footprint, which is smaller again because coverage is
 * capped at 60 per cent.
 *
 * Only numbers sit inside the SVG. Wording lives in the HTML legend below,
 * where it uses the real Arabic face, stays legible when the drawing scales
 * down, and cannot collide with a dimension line.
 */
function PlotDiagram({ lang }: { lang: Lang }) {
  const ar = lang === 'ar'
  const L = ar
    ? { plot: 'قطعة ٢٠ × ٣٠ م', street: 'الشارع',
        legPlot: 'حدود الأرض', legEnv: 'حدود البناء بعد الارتدادات', legFoot: 'مسقط الدور الأرضي، ٦٠٪',
        front: 'أمامي', rear: 'خلفي', side: 'جانبي' }
    : { plot: 'Plot 20 × 30 m', street: 'Street',
        legPlot: 'Plot boundary', legEnv: 'Buildable after setbacks', legFoot: 'Ground floor footprint, 60%',
        front: 'Front', rear: 'Rear', side: 'Side' }

  const M = 11
  const x0 = 78, y0 = 30, w = 20 * M, h = 30 * M
  const ex = x0 + 1.5 * M, ey = y0 + 2 * M
  const ew = w - 3 * M, eh = h - 5 * M
  const fw = 16 * M, fh = 22.5 * M
  const fx = ex + (ew - fw) / 2, fy = ey + (eh - fh) / 2

  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <svg viewBox="0 0 380 400" className="h-auto w-full" role="img" aria-label={L.plot}>
        <rect x={x0} y={y0} width={w} height={h}
              fill="var(--color-sunken)" stroke="var(--color-line-strong)" strokeWidth="1.5" />
        <rect x={ex} y={ey} width={ew} height={eh}
              fill="none" stroke="var(--color-muted)" strokeWidth="1.2" strokeDasharray="5 4" />
        <rect x={fx} y={fy} width={fw} height={fh} fill="var(--color-ink)" opacity="0.9" />

        {/* Numbers only. Font size chosen so it stays readable once scaled down. */}
        <Dim x1={x0 + w / 2} y1={ey + eh} x2={x0 + w / 2} y2={y0 + h} />
        <text x={x0 + w / 2 + 10} y={ey + eh + 24} fontSize="15"
              fill="var(--color-ink)" fontFamily="var(--font-mo)">3.00</text>

        <Dim x1={x0 + w / 2} y1={y0} x2={x0 + w / 2} y2={ey} />
        <text x={x0 + w / 2 + 10} y={y0 + 17} fontSize="15"
              fill="var(--color-ink)" fontFamily="var(--font-mo)">2.00</text>

        <Dim x1={x0} y1={y0 + h / 2} x2={ex} y2={y0 + h / 2} horizontal />
        <text x={x0 - 12} y={y0 + h / 2 + 5} fontSize="15" textAnchor="end"
              fill="var(--color-ink)" fontFamily="var(--font-mo)">1.50</text>

        <line x1={x0 - 18} y1={y0 + h + 26} x2={x0 + w + 18} y2={y0 + h + 26}
              stroke="var(--color-line-strong)" strokeWidth="2.5" />
      </svg>

      <div className="mt-1 grid gap-2 border-t border-line pt-3 text-[12px]">
        <Legend swatch={<span className="block h-3 w-3 border border-line-strong bg-sunken" />}
                label={L.legPlot} value={L.plot} />
        <Legend swatch={<span className="block h-3 w-3 border border-dashed border-muted" />}
                label={L.legEnv}
                value={`${L.front} 3.00 · ${L.rear} 2.00 · ${L.side} 1.50`} />
        <Legend swatch={<span className="block h-3 w-3 bg-ink" />} label={L.legFoot} value="" />
      </div>
    </div>
  )
}

function Legend({
  swatch, label, value,
}: {
  swatch: React.ReactNode; label: string; value: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="shrink-0">{swatch}</span>
      <span className="text-ink">{label}</span>
      {value ? <span className="mono ms-auto text-[11px] text-muted">{value}</span> : null}
    </div>
  )
}

/** A dimension line with arrowheads at both ends. */
function Dim({
  x1, y1, x2, y2, horizontal = false,
}: {
  x1: number; y1: number; x2: number; y2: number; horizontal?: boolean
}) {
  const head = (x: number, y: number, dir: 1 | -1) =>
    horizontal
      ? `M ${x + 4 * dir} ${y - 4} L ${x} ${y} L ${x + 4 * dir} ${y + 4}`
      : `M ${x - 4} ${y + 4 * dir} L ${x} ${y} L ${x + 4} ${y + 4 * dir}`

  return (
    <g stroke="var(--color-ink)" strokeWidth="1.2" fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <path d={head(x1, y1, 1)} />
      <path d={head(x2, y2, -1)} />
    </g>
  )
}

/** One failing row and one "not checked" row, the two states that matter. */
function ReportPreview({ lang }: { lang: Lang }) {
  return (
    <div className="grid content-start gap-3 rounded-lg bg-card p-4 text-ink">
      <div className="grid gap-2 rounded border-s-[3px] border-s-fail-fg bg-fail-bg px-3.5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm border border-fail-line bg-card px-2 py-0.5 text-[10.5px] font-semibold text-fail-fg">
            {t('fail', lang)}
          </span>
          <span className="text-[13.5px] font-semibold">{checkName('setback.front.min', lang)}</span>
        </div>
        <div className="flex flex-wrap gap-4 text-[12.5px]">
          <span className="text-muted">
            {t('observed', lang)} <b className="fig text-fail-fg">2.40</b>
          </span>
          <span className="text-muted">
            {t('minimum', lang)} <b className="fig text-ink">3.00</b>
          </span>
        </div>
        <div className="mono text-[10.5px] text-muted">
          {t('clause', lang)} F.1.1 · {t('page', lang)} 3 · A-101
        </div>
      </div>

      <div className="grid gap-2 rounded border-s-[3px] border-s-nc-line bg-nc-bg px-3.5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-sm border border-nc-line bg-card px-2 py-0.5 text-[10.5px] font-semibold text-nc-fg">
            {t('notChecked', lang)}
          </span>
          <span className="text-[13.5px] font-semibold">
            {checkName('egress.travel_distance.max', lang)}
          </span>
        </div>
        <p className="text-[12.5px] leading-[1.6] text-nc-fg">
          {lang === 'ar'
            ? 'لم يُعثر على بيانات كافية في المخططات. راجعه يدويًا.'
            : 'Not enough data in the drawings. Review it manually.'}
        </p>
      </div>
    </div>
  )
}
