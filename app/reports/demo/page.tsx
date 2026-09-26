import { Chrome, langFrom } from '@/components/Chrome'
import { Lockup } from '@/components/Logo'
import { ClauseQuote } from '@/components/ClauseQuote'
import { Stat, VerdictBadge } from '@/components/Verdict'
import { getDemoReport } from '@/lib/demo/corpus'
import { checkName, t, type Lang } from '@/lib/i18n'
import type { GroundedFinding, GroundingRejection, NotCheckedEntry } from '@/lib/rules/grounding'

/**
 * Everything below is rendered from objects the grounding gate produced. No
 * citation on this page was typed into the markup.
 */
export default async function DemoReportPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const lang = langFrom(await searchParams)
  const report = await getDemoReport()
  const s = report.submission

  const fails = report.findings.filter((f) => f.outcome === 'fail')
  const passes = report.findings.filter((f) => f.outcome === 'pass')

  return (
    <Chrome lang={lang} current="report">
      <article className="mt-8 overflow-hidden rounded-lg border border-line-strong bg-card shadow-[0_1px_2px_rgba(21,24,28,0.05)]">
        <header className="flex flex-wrap items-start gap-5 border-b border-line px-6 py-5">
          <Lockup height={26} className="shrink-0 text-ink" />
          <div className="min-w-[200px] flex-1">
            <h1 className="text-[16px] font-semibold">{t('reportTitle', lang)}</h1>
            <p className="text-[12.5px] text-muted">
              {s.projectAr} · {t('plot', lang)} <span className="fig">{s.plotNumber}</span>{' '}
              {t('plan', lang)} <span className="fig">{s.planNumber}</span> · {s.zoneAr}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Stat n={fails.length} label={t('fail', lang)} tone="fail" />
            <Stat n={passes.length} label={t('pass', lang)} tone="pass" />
            <Stat n={report.notChecked.length} label={t('notChecked', lang)} tone="not_checked" />
          </div>
        </header>

        <div className="mono flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-line bg-sunken px-6 py-2 text-[10.5px] text-muted">
          <span>
            {t('reference', lang)}: {report.docCode} ({report.documentTitleAr})
          </span>
          <span>
            sha256 <span className="fig">{report.sourceSha256.slice(0, 16)}</span>
          </span>
          <span>
            {report.clauseCount} {t('clausesLoaded', lang)}
          </span>
        </div>

        <div>
          {fails.map((f) => (
            <Finding key={f.ruleId} finding={f} lang={lang} />
          ))}
          {report.notChecked.map((n) => (
            <NotChecked key={n.rule.ruleId} entry={n} lang={lang} />
          ))}
          {passes.map((f) => (
            <Finding key={f.ruleId} finding={f} lang={lang} />
          ))}
        </div>
      </article>

      {report.rejections.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[17px] font-semibold">{t('suppressedTitle', lang)}</h2>
          <p className="mt-1.5 max-w-[66ch] text-[13.5px] text-muted">{t('suppressedBody', lang)}</p>
          <div className="mt-4 grid gap-3">
            {report.rejections.map((r, i) => (
              <Rejection key={i} rejection={r} lang={lang} />
            ))}
          </div>
        </section>
      ) : null}
    </Chrome>
  )
}

function Finding({ finding, lang }: { finding: GroundedFinding; lang: Lang }) {
  const failed = finding.outcome === 'fail'
  const p = finding.parameters as Record<string, unknown>

  return (
    <section
      className={`grid gap-3 border-b border-line px-6 py-5 last:border-b-0 ${
        failed ? 'border-s-[3px] border-s-sev-blocking' : 'border-s-[3px] border-s-pass-line'
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <VerdictBadge outcome={finding.outcome} lang={lang} />
        <h3 className="min-w-[150px] flex-1 text-[15px] font-semibold">
          {checkName(finding.ruleKey, lang)}
        </h3>
        <span className="fig text-[10.5px] text-muted">{finding.ruleKey}</span>
      </div>

      <Measures finding={finding} params={p} lang={lang} />

      <ClauseQuote citation={finding.citation} lang={lang} />

      <div className="mono flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        {finding.location ? (
          <>
            <span>
              {t('sheet', lang)} {finding.location.sheetId} {finding.location.sheetLabel}
            </span>
            {finding.locationConfidence === 'exact' ? (
              <span>
                {t('location', lang)}{' '}
                <span className="fig">
                  {Math.round(finding.location.x)} · {Math.round(finding.location.y)}
                </span>
              </span>
            ) : null}
          </>
        ) : (
          <span>{t('locationUnknown', lang)}</span>
        )}
        {finding.confidence != null ? (
          <span>
            {t('confidence', lang)}{' '}
            <span className="fig">{(finding.confidence * 100).toFixed(0)}%</span>
          </span>
        ) : null}
      </div>
    </section>
  )
}

/** Reads the threshold out of the rule's own parameters, never from the model. */
function Measures({
  finding,
  params,
  lang,
}: {
  finding: GroundedFinding
  params: Record<string, unknown>
  lang: Lang
}) {
  const unit = finding.observedUnit ?? ''
  const observed = finding.observedValue

  const min = numeric(params.min_m ?? params.min_mm ?? params.min_exits ?? params.spaces_per_unit)
  const max = numeric(params.max_m ?? params.max_mm ?? params.max_ratio ?? params.max_floors)
  const limit = min ?? max
  const isMin = min != null

  const asRatio = unit === 'ratio'
  const fmt = (v: number | string | null): string => {
    if (v == null) return '—'
    if (typeof v === 'string') return v
    return asRatio ? `${Math.round(v * 100)}%` : v.toFixed(unit === 'mm' ? 0 : 2)
  }

  const shortfall =
    typeof observed === 'number' && limit != null && !asRatio
      ? isMin
        ? limit - observed
        : observed - limit
      : null

  return (
    <div className="flex flex-wrap gap-x-7 gap-y-2 text-[13.5px]">
      <Measure
        label={asRatio ? t('computed', lang) : t('observed', lang)}
        value={fmt(observed)}
        unit={asRatio ? '' : unit}
        bad={finding.outcome === 'fail'}
      />
      {limit != null ? (
        <Measure
          label={isMin ? t('minimum', lang) : t('maximum', lang)}
          value={fmt(limit)}
          unit={asRatio ? '' : unit}
        />
      ) : null}
      {shortfall != null && shortfall > 0 && finding.outcome === 'fail' ? (
        <Measure label={t('difference', lang)} value={fmt(shortfall)} unit={unit} bad />
      ) : null}
    </div>
  )
}

function Measure({
  label,
  value,
  unit,
  bad = false,
}: {
  label: string
  value: string
  unit?: string
  bad?: boolean
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[12px] text-muted">{label}</span>
      <span className={`fig text-[14.5px] font-medium ${bad ? 'text-fail-fg' : ''}`}>
        {value}
        {unit ? <span className="ms-1 text-[11px] text-muted">{unit}</span> : null}
      </span>
    </div>
  )
}

function NotChecked({ entry, lang }: { entry: NotCheckedEntry; lang: Lang }) {
  return (
    <section className="grid gap-3 border-b border-line border-s-[3px] border-s-nc-line bg-nc-bg px-6 py-5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-3">
        <VerdictBadge outcome="not_checked" lang={lang} />
        <h3 className="min-w-[150px] flex-1 text-[15px] font-semibold">
          {checkName(entry.rule.ruleKey, lang)}
        </h3>
        <span className="fig text-[10.5px] text-muted">{entry.rule.ruleKey}</span>
      </div>
      <p className="text-[13.5px] text-nc-fg">{entry.detailAr}</p>
      <ClauseQuote
        lang={lang}
        citation={{
          clauseId: entry.rule.clauseId,
          documentId: entry.rule.documentId,
          codeSystem: entry.rule.codeSystem,
          docCode: entry.rule.docCode,
          editionYear: entry.rule.editionYear,
          documentTitleAr: entry.rule.documentTitleAr,
          clauseNumber: entry.rule.clauseNumber,
          clauseHeadingAr: entry.rule.clauseHeadingAr,
          clauseTextAr: entry.rule.clauseTextAr,
          clauseTextEn: entry.rule.clauseTextEn,
          summaryAr: entry.rule.summaryAr,
          summaryEn: entry.rule.summaryEn,
          reproductionRights: entry.rule.reproductionRights,
          sourceUrl: entry.rule.sourceUrl,
          sourcePage: entry.rule.clausePageNumber,
          sourceSha256: entry.rule.sourceSha256,
          isFixture: entry.rule.isFixture,
        }}
      />
    </section>
  )
}

function Rejection({ rejection, lang }: { rejection: GroundingRejection; lang: Lang }) {
  const reason =
    rejection.reason === 'unknown_rule'
      ? t('reasonUnknownRule', lang)
      : rejection.reason === 'clause_reference_mismatch'
        ? t('reasonClauseMismatch', lang)
        : rejection.detail

  return (
    <div className="rounded-md border border-line bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="mono rounded-sm border border-line bg-sunken px-2 py-0.5 text-[10.5px] text-muted">
          {rejection.reason}
        </span>
        <span className="fig flex-1 text-[12.5px]">{rejection.attemptedRuleKey}</span>
      </div>
      <p className="mt-2 text-[13px] text-muted">{reason}</p>
      {rejection.attemptedClauseRef ? (
        <p className="mono mt-2 text-[11.5px] text-muted">
          {t('claimedClause', lang)}: {rejection.attemptedClauseRef}
        </p>
      ) : null}
      {rejection.attemptedText ? (
        <div className="mt-2 rounded border border-dashed border-fail-line bg-fail-bg/40 p-2.5">
          <div className="mono mb-1 text-[10.5px] text-fail-fg">
            {t('claimedText', lang)} · {t('discarded', lang)}
          </div>
          <p className="text-[13px] text-muted line-through decoration-fail-line">
            {rejection.attemptedText}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function numeric(v: unknown): number | null {
  return typeof v === 'number' ? v : null
}
