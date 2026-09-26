import Link from 'next/link'
import { Chrome, langFrom } from '@/components/Chrome'
import { Symbol } from '@/components/Logo'
import { t } from '@/lib/i18n'
import { getDemoReport } from '@/lib/demo/corpus'

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const lang = langFrom(await searchParams)
  const report = await getDemoReport()
  const q = lang === 'en' ? '?lang=en' : ''

  return (
    <Chrome lang={lang} current="review">
      <section className="grid gap-5 pt-14 pb-10">
        <h1 className="max-w-[20ch] text-[clamp(26px,4.2vw,36px)] leading-[1.3] font-semibold tracking-tight text-balance">
          {t('heroTitle', lang)}
        </h1>
        <p className="max-w-[62ch] text-[15px] text-muted">{t('heroBody', lang)}</p>
        <p className="flex max-w-[62ch] items-start gap-2.5 border-s-2 border-ink ps-3.5 text-[14px]">
          <Symbol size={17} className="mt-1 shrink-0 text-ink" />
          <span>{t('heroPromise', lang)}</span>
        </p>
      </section>

      <section className="grid gap-4 rounded-lg border border-line bg-card p-6">
        <h2 className="text-[17px] font-semibold">{t('uploadTitle', lang)}</h2>

        <div className="grid place-items-center gap-1.5 rounded-md border border-dashed border-line-strong bg-sunken px-6 py-11 text-center">
          <Symbol size={26} className="text-line-strong" />
          <div className="text-[14px] text-muted">{t('uploadDrop', lang)}</div>
          <div className="text-[11px] text-muted">{t('uploadHint', lang)}</div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t('plotWidth', lang)} value="20.00" unit="m" />
          <Field label={t('plotDepth', lang)} value="30.00" unit="m" />
          <Field label={t('zone', lang)} value={lang === 'ar' ? 'سكني أ' : 'Residential A'} />
          <Field label={t('buildingType', lang)} value={t('villa', lang)} />
        </div>

        <div className="rounded-md border border-nc-line bg-nc-bg p-4">
          <div className="mb-1 text-[13.5px] font-semibold">{t('notWiredTitle', lang)}</div>
          <p className="max-w-[64ch] text-[13px] text-nc-fg">{t('notWired', lang)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded border border-line bg-sunken px-4 py-2 text-[13.5px] text-muted"
          >
            {t('startReview', lang)}
          </button>
          <Link
            href={`/reports/demo${q}`}
            className="rounded bg-ink px-4 py-2 text-[13.5px] font-medium text-on-ink hover:opacity-90"
          >
            {t('seeSample', lang)}
          </Link>
        </div>
      </section>

      <section className="mt-5 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
        <Tile n={report.clauseCount} label={t('clausesLoaded', lang)} />
        <Tile n={report.groundableRules.length} label={lang === 'ar' ? 'فحصًا مفعّلًا' : 'active checks'} />
        <Tile n={report.rejections.length} label={t('suppressed', lang)} />
      </section>
    </Chrome>
  )
}

function Field({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] text-muted">{label}</span>
      <span className="flex items-baseline gap-1.5 rounded border border-line bg-card px-3 py-2">
        <span className="fig text-[14px]">{value}</span>
        {unit ? <span className="fig text-[11px] text-muted">{unit}</span> : null}
      </span>
    </label>
  )
}

function Tile({ n, label }: { n: number; label: string }) {
  return (
    <div className="bg-card px-5 py-4">
      <div className="fig text-[22px] leading-tight font-medium">{n}</div>
      <div className="text-[12px] text-muted">{label}</div>
    </div>
  )
}
