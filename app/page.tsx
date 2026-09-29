import Link from 'next/link'
import { HeroFigure } from '@/components/landing/HeroFigure'
import { HtmlLang } from '@/components/landing/HtmlLang'
import { langFrom } from '@/components/Chrome'
import {
  ARCH_STYLES,
  LANDING_FINDINGS,
  LANDING_SOURCES,
  LANDING_STEPS,
  DIR,
  t,
  type Lang,
} from '@/lib/i18n'

/**
 * The landing page, ported from design/landing.html.
 *
 * The design replaces the app's header and footer with a drawing title block and
 * runs to 1320px rather than the app's 1024px, so this page does not use the
 * Chrome shell. It keeps the app's fonts, tokens and ?lang= switching.
 */
export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const lang = langFrom(await searchParams)
  const q = lang === 'en' ? '?lang=en' : ''
  const otherQ = lang === 'ar' ? '?lang=en' : ''

  return (
    <div
      dir={DIR[lang]}
      lang={lang}
      className={`bg-white text-ink ${
        lang === 'ar' ? 'font-[family-name:var(--font-ar)]' : 'font-[family-name:var(--font-la)]'
      }`}
    >
      <HtmlLang lang={lang} />

      {/* ===================== hero, sheet A-00 ===================== */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="sheet-rule" aria-hidden="true">
          <i /><i /><i /><i />
        </div>

        <div className="sheet-wrap relative pt-5 pb-[clamp(20px,4vw,56px)]">
          <TitleBlock lang={lang} q={q} otherQ={otherQ} sheet="A-00" />

          <div className="flex flex-wrap items-end gap-x-16 gap-y-12 pt-[clamp(48px,8vw,104px)] pb-2">
            <div className="min-w-0 max-w-[560px] flex-[1_1_360px]">
              <span className="mono inline-block text-[12px] tracking-[0.12em] text-rule">
                A-00 · 1:1
              </span>
              <div className="mt-3 mb-9 text-[clamp(88px,14vw,168px)] leading-none font-bold">
                {t('brand', lang)}
              </div>
              <h1 className="text-[clamp(26px,3.4vw,40px)] leading-[1.35] font-semibold text-balance">
                <span className="font-semibold">{t('heroA', lang)}</span>{' '}
                <span className="font-light">{t('heroB', lang)}</span>
              </h1>
              <p className="mt-6 max-w-[46ch] text-[17px] text-rule text-pretty">
                {t('heroSub', lang)}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
                <SheetButton href={`/app${q}`}>{t('cta', lang)}</SheetButton>
                <Link href={`/reports/demo${q}`} className="text-[15px] text-rule hover:text-line">
                  {t('cta2', lang)}
                </Link>
              </div>
            </div>

            <HeroFigure lang={lang} />
          </div>
        </div>
      </section>

      {/* ===================== A-01 the problem ===================== */}
      <Sheet no="A-01" name={t('a01Name', lang)} scale="NTS">
        <div className="flex flex-wrap gap-x-[clamp(40px,6vw,96px)] gap-y-12 pt-12">
          <div className="min-w-0 flex-[3_1_480px]">
            <h2 className="text-[clamp(26px,3.2vw,40px)] leading-[1.35] font-semibold text-balance">
              {t('a01Title', lang)}
            </h2>
            <p className="mt-6 max-w-[62ch] text-[18px] text-pretty">{t('a01p1', lang)}</p>
            <p className="mt-5 max-w-[62ch] text-[18px] text-slate text-pretty">
              {t('a01p2', lang)}
            </p>
          </div>

          <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-7 border-s border-rule ps-6">
            <Note value="16.03.2025" mono label={t('n1Label', lang)} />
            <Note value={t('n2Val', lang)} label={t('n2Label', lang)} />
            <Note value={t('n3Val', lang)} label={t('n3Label', lang)} />
          </div>
        </div>
      </Sheet>

      {/* ===================== A-02 how it works ===================== */}
      <Sheet no="A-02" name={t('a02Name', lang)} scale="NTS">
        <h2 className="mt-12 max-w-[24ch] text-[clamp(26px,3.2vw,40px)] leading-[1.35] font-semibold text-balance">
          {t('a02Title', lang)}
        </h2>
        <ol className="mt-14 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-y-12">
          {LANDING_STEPS[lang].map((step) => (
            <li key={step.n} className="relative border-t border-ink pt-7 pe-7">
              <span
                aria-hidden="true"
                className="absolute -top-[5px] start-0 h-[9px] w-[9px] rounded-full bg-ink"
              />
              <span className="mono inline-block text-[12px] text-slate">{step.n}</span>
              <h3 className="mt-1 mb-2 text-[20px] font-semibold">{step.h}</h3>
              <p className="max-w-[30ch] text-[15px] text-slate text-pretty">{step.p}</p>
            </li>
          ))}
        </ol>
      </Sheet>

      {/* ===================== A-03 the report ===================== */}
      <Sheet no="A-03" name={t('a03Name', lang)} scale="1:1">
        <div className="flex flex-wrap gap-x-[clamp(40px,6vw,96px)] gap-y-12 pt-12">
          <div className="min-w-0 flex-[3_1_480px]">
            <span className="mb-2.5 inline-block border border-slate px-2 text-[13px] text-slate">
              {t('a03Cap', lang)}
            </span>
            <ReportMock lang={lang} />
          </div>
          <div className="min-w-0 flex-[1_1_240px]">
            <h2 className="text-[clamp(22px,2.4vw,28px)] leading-[1.35] font-semibold text-balance">
              {t('a03Title', lang)}
            </h2>
            <p className="mt-4 max-w-[44ch] text-[16px] text-slate text-pretty">
              {t('a03Body', lang)}
            </p>
          </div>
        </div>
      </Sheet>

      {/* ===================== A-04 the three patterns ===================== */}
      <Sheet no="A-04" name={t('a04Name', lang)} scale="1:200">
        <div className="flex flex-wrap gap-x-[clamp(40px,6vw,96px)] gap-y-8 pt-12">
          <div className="min-w-0 flex-[3_1_480px]">
            <h2 className="text-[clamp(26px,3.2vw,40px)] leading-[1.35] font-semibold text-balance">
              {t('a04Title', lang)}
            </h2>
          </div>
          <div className="min-w-0 flex-[1_1_240px]">
            <p className="max-w-[44ch] text-[16px] text-slate text-pretty">{t('a04Body', lang)}</p>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-y-12 border-b border-rule">
          {([1, 2, 3] as const).map((i) => (
            <div
              key={i}
              className="border-s border-rule px-4 pb-7 last:border-e last:border-e-rule"
            >
              <PatternElevation pattern={i} />
              <div className="mt-4 flex items-center gap-3">
                <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full border border-ink text-[13px] leading-none">
                  {i}
                </span>
                <strong className="flex-1 border-b-2 border-ink pb-0.5 text-[17px] font-semibold">
                  {t(`p${i}` as 'p1' | 'p2' | 'p3', lang)}
                </strong>
                <span className="mono text-[12px] text-slate">1:200</span>
              </div>
            </div>
          ))}
        </div>
      </Sheet>

      {/* ===================== A-05 the 19 styles ===================== */}
      <Sheet no="A-05" name={t('a05Name', lang)} scale="NTS">
        <div className="flex flex-wrap gap-x-[clamp(40px,6vw,96px)] gap-y-10 pt-12">
          <div className="min-w-0 flex-[1_1_240px]">
            <h2 className="max-w-[18ch] text-[22px] leading-[1.45] font-semibold">
              {t('a05Title', lang)}
            </h2>
          </div>

          <div className="min-w-0 flex-[2.5_1_480px] border-t-2 border-ink">
            <div className="flex gap-4 border-b border-ink py-2 text-[12px] text-slate">
              <span className="w-10 flex-none">{t('colNo', lang)}</span>
              <span>{t('colName', lang)}</span>
            </div>
            <ol className="[column-gap:40px] [columns:2_240px]">
              {ARCH_STYLES.map((style, i) => (
                <li
                  key={style.ar}
                  className="flex break-inside-avoid gap-4 border-b border-rule py-2.5 text-[14px]"
                >
                  <span className="mono w-10 flex-none text-start text-slate">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{lang === 'ar' ? style.ar : style.en}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Sheet>

      {/* ===================== A-06 sources ===================== */}
      <Sheet no="A-06" name={t('a06Name', lang)} scale="NTS">
        <ol className="mt-12 border-t-2 border-ink">
          {LANDING_SOURCES[lang].map((src) => (
            <li
              key={src.h}
              className="flex flex-wrap justify-between gap-x-6 gap-y-0.5 border-b border-rule py-3.5"
            >
              <strong className="text-[16px] font-medium">{src.h}</strong>
              <span className="text-[14px] text-slate">{src.b}</span>
            </li>
          ))}
        </ol>
        <p className="mt-5 max-w-[62ch] text-[14px] text-slate">{t('disclaimer', lang)}</p>
      </Sheet>

      {/* ===================== close, sheet A-07 ===================== */}
      <section className="relative mt-[clamp(72px,10vw,136px)] overflow-hidden bg-ink text-white">
        <div className="sheet-rule" aria-hidden="true">
          <i /><i /><i /><i />
        </div>
        <div className="sheet-wrap relative pt-[clamp(72px,10vw,128px)] pb-6">
          <div className="flex flex-wrap items-end justify-between gap-x-16 gap-y-8 pb-[clamp(64px,9vw,112px)]">
            <div>
              <h2 className="max-w-[18ch] text-[clamp(30px,4.4vw,56px)] leading-[1.25] font-semibold text-balance">
                {t('closeTitle', lang)}
              </h2>
              <p className="mt-5 max-w-[44ch] text-[17px] text-rule">{t('closeBody', lang)}</p>
            </div>
            <SheetButton href={`/app${q}`}>{t('cta', lang)}</SheetButton>
          </div>

          <TitleBlock lang={lang} q={q} otherQ={otherQ} sheet="A-07" footer />
        </div>
      </section>
    </div>
  )
}

/* ---------------------------------------------------------------- pieces -- */

/**
 * The drawing title block, used as both header and footer.
 *
 * The design's language control is a button that rewrites the URL in place. This
 * uses a Link instead, so switching language is a real navigation like every
 * other page in the app and works without JavaScript. It is styled to match.
 */
function TitleBlock({
  lang,
  q,
  otherQ,
  sheet,
  footer = false,
}: {
  lang: Lang
  q: string
  otherQ: string
  sheet: string
  footer?: boolean
}) {
  return (
    <div className="flex flex-wrap border border-slate text-[13px] [&>*]:flex [&>*]:items-center [&>*]:px-4.5 [&>*]:py-2.5 [&>*+*]:border-s [&>*+*]:border-s-slate">
      <Link href={`/${q}`} className="text-[22px] leading-none font-bold text-white no-underline">
        {t('brand', lang)}
      </Link>

      {footer ? (
        <div className="flex-[1_1_180px] text-rule">{t('copy', lang)}</div>
      ) : (
        <nav className="flex-[1_1_200px] flex-wrap gap-x-[22px] gap-y-1 text-rule">
          <Link href={`/app${q}`} className="whitespace-nowrap no-underline">
            {t('navApp', lang)}
          </Link>
          <Link href={`/reports/demo${q}`} className="whitespace-nowrap no-underline">
            {t('navReport', lang)}
          </Link>
        </nav>
      )}

      <div className="!flex-col !items-start justify-center !py-1.5">
        <small className="text-[10px] leading-[1.4] text-rule">
          {footer ? t('lblDate', lang) : t('lblSheet', lang)}
        </small>
        <span className="mono leading-[1.4]">{footer ? '2026' : sheet}</span>
      </div>

      <Link
        href={`/${otherQ}`}
        className={`whitespace-nowrap text-white no-underline ${
          lang === 'ar' ? 'font-[family-name:var(--font-la)]' : 'font-[family-name:var(--font-ar)]'
        }`}
      >
        {t('langSwitch', lang)}
      </Link>
    </div>
  )
}

/** A numbered sheet with its title bar. */
function Sheet({
  no,
  name,
  scale,
  children,
}: {
  no: string
  name: string
  scale: string
  children: React.ReactNode
}) {
  return (
    <section className="sheet-wrap pt-[clamp(72px,10vw,136px)]">
      <div className="flex flex-wrap items-stretch border-t-2 border-ink border-b border-b-rule">
        <div className="mono border-e border-e-rule py-3.5 pe-6 text-[28px] leading-[1.2] font-medium">
          {no}
        </div>
        <div className="flex-[1_1_200px] px-6 py-3.5 text-[13px] text-slate">{name}</div>
        <div className="border-s border-s-rule py-3.5 ps-6 text-[12px] text-slate">
          {scale === 'NTS' || scale.includes(':') ? 'المقياس' : ''}
          <span className="mono block text-ink">{scale}</span>
        </div>
      </div>
      {children}
    </section>
  )
}

/** The design's primary button: solid, square, with a trailing rule. */
function SheetButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-3.5 bg-white px-6 py-3.5 text-[16px] font-semibold text-ink no-underline hover:bg-rule after:block after:h-px after:w-7 after:bg-current"
    >
      {children}
    </Link>
  )
}

function Note({ value, label, mono = false }: { value: string; label: string; mono?: boolean }) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="absolute -inset-is-[29px] top-2.5 start-[-29px] h-[9px] w-[9px] rounded-full border border-ink bg-white"
      />
      <div
        className={`text-[22px] leading-[1.3] ${mono ? 'mono font-normal' : 'font-semibold'}`}
      >
        {value}
      </div>
      <div className="text-[14px] text-slate">{label}</div>
    </div>
  )
}

/** The report mock from sheet A-03. Static, illustrative. */
function ReportMock({ lang }: { lang: Lang }) {
  return (
    <div className="border-2 border-ink bg-white">
      <div className="flex flex-wrap border-b border-ink">
        <div className="flex-[1_1_220px] px-5 py-4">
          <strong className="block text-[20px] leading-[1.4] font-semibold">
            {t('rTitle', lang)}
          </strong>
          <span className="text-[14px] text-slate">{t('rProject', lang)}</span>
        </div>
        <dl className="flex text-[12px]">
          <div className="border-s border-s-rule px-4.5 py-4">
            <dt className="text-slate">{t('rStyleL', lang)}</dt>
            <dd className="text-[14px]">{t('rStyleV', lang)}</dd>
          </div>
          <div className="border-s border-s-rule px-4.5 py-4">
            <dt className="text-slate">{t('rPatL', lang)}</dt>
            <dd className="text-[14px]">{t('rPatV', lang)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap">
        <figure className="m-0 flex-[1_1_220px] border-e border-e-rule bg-wash p-4.5">
          <ElevationMini />
          <figcaption className="mt-2.5 flex justify-between gap-2 text-[12px] text-slate">
            <span>{t('rElev', lang)}</span>
            <span className="mono">1:200</span>
          </figcaption>
        </figure>

        <div className="min-w-0 flex-[2_1_300px]">
          <div className="border-b border-rule px-5 py-3 text-[13px] text-slate">
            {t('rSummary', lang)}
          </div>
          {LANDING_FINDINGS[lang].map((f) => (
            <div key={f.n} className="flex gap-3.5 border-b border-rule px-5 py-4.5 last:border-b-0">
              <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full border border-ink text-[11px] leading-none">
                {f.n}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${
                      f.tone === 'issue' ? 'text-issue' : 'text-ok'
                    } before:block before:h-2 before:w-2 before:bg-current`}
                  >
                    {f.status}
                  </span>
                  <span className="text-[16px] font-semibold">{f.h}</span>
                  <span className="mono text-[13px]">{f.v}</span>
                </div>
                <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5 gap-y-0.5 text-[13px]">
                  <dt className="text-slate">{t('lblLoc', lang)}</dt>
                  <dd className="text-pretty">{f.loc}</dd>
                  <dt className="text-slate">{t('lblRef', lang)}</dt>
                  <dd className="text-pretty">{f.ref}</dd>
                  <dt className="text-slate">{t('lblWhy', lang)}</dt>
                  <dd className="text-pretty">{f.why}</dd>
                </dl>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Small elevation used inside the report mock, with the flagged window marked. */
function ElevationMini() {
  return (
    <svg viewBox="0 0 220 180" className="block w-full max-w-[320px]" fill="none" aria-hidden="true">
      <g stroke="#15181C" strokeWidth="1.5">
        <rect x="18" y="26" width="184" height="132" />
        <line x1="18" y1="44" x2="202" y2="44" strokeWidth="1" />
        <line x1="18" y1="100" x2="202" y2="100" strokeWidth="1" />
      </g>
      <g stroke="#15181C" strokeWidth="1">
        <rect x="40" y="60" width="26" height="30" />
        <rect x="154" y="60" width="26" height="30" />
        <rect x="40" y="116" width="26" height="28" />
        <rect x="154" y="116" width="26" height="28" />
        <rect x="98" y="118" width="26" height="40" />
      </g>
      <rect x="86" y="56" width="50" height="36" stroke="#B4413C" strokeWidth="2" />
      <circle cx="140" cy="52" r="9" fill="#FFFFFF" stroke="#15181C" strokeWidth="1" />
      <text x="140" y="56" fontSize="10" textAnchor="middle" fill="#15181C"
            fontFamily="IBM Plex Mono, monospace">1</text>
      <line x1="18" y1="170" x2="202" y2="170" stroke="#5B6169" strokeWidth="1" />
    </svg>
  )
}

/**
 * Three elevations for sheet A-04.
 *
 * Same massing in all three; openings, parapet and detail change. Abstract and
 * generic, as the design specifies. Not any real building.
 */
function PatternElevation({ pattern }: { pattern: 1 | 2 | 3 }) {
  const openings =
    pattern === 1
      ? [[46, 74, 22, 26], [122, 74, 22, 26], [46, 120, 22, 24], [122, 120, 22, 24]]
      : pattern === 2
        ? [[42, 72, 30, 30], [118, 72, 30, 30], [42, 118, 30, 28], [118, 118, 30, 28]]
        : [[40, 68, 44, 36], [110, 68, 44, 36], [40, 116, 44, 32], [110, 116, 44, 32]]

  return (
    <svg viewBox="0 0 200 170" className="block w-full" fill="none" aria-hidden="true">
      <g stroke="#15181C" strokeWidth="1.5">
        <rect x="26" y="40" width="148" height="112" />
        {/* parapet: tall and stepped when traditional, flat when contemporary */}
        {pattern === 1 ? (
          <>
            <line x1="26" y1="40" x2="174" y2="40" strokeWidth="2.5" />
            <line x1="26" y1="30" x2="174" y2="30" strokeWidth="1" />
            {[40, 70, 100, 130].map((x) => (
              <line key={x} x1={x} y1="30" x2={x} y2="40" strokeWidth="1" />
            ))}
          </>
        ) : pattern === 2 ? (
          <line x1="26" y1="36" x2="174" y2="36" strokeWidth="2.5" />
        ) : (
          <line x1="26" y1="40" x2="174" y2="40" strokeWidth="2.5" />
        )}
        <line x1="26" y1="104" x2="174" y2="104" strokeWidth="1" />
      </g>
      <g stroke="#15181C" strokeWidth="1">
        {openings.map(([x, y, w, h]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} />
        ))}
        <rect x="88" y="120" width="24" height="32" />
      </g>
      <line x1="16" y1="152" x2="184" y2="152" stroke="#5B6169" strokeWidth="1.5" />
    </svg>
  )
}
