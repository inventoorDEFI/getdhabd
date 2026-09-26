import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'

export type Outcome = 'fail' | 'pass' | 'not_checked'

const STYLES: Record<Outcome, string> = {
  fail: 'bg-fail-bg text-fail-fg border-fail-line',
  pass: 'bg-pass-bg text-pass-fg border-pass-line',
  not_checked: 'bg-card text-nc-fg border-nc-line',
}

const LABEL = { fail: 'fail', pass: 'pass', not_checked: 'notChecked' } as const

export function VerdictBadge({ outcome, lang }: { outcome: Outcome; lang: Lang }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-sm border px-2.5 py-0.5 text-[11px] font-semibold ${STYLES[outcome]}`}
    >
      {t(LABEL[outcome], lang)}
    </span>
  )
}

/** Count tile in the report header. */
export function Stat({
  n,
  label,
  tone,
}: {
  n: number
  label: string
  tone: Outcome
}) {
  const border = { fail: 'border-fail-line', pass: 'border-pass-line', not_checked: 'border-nc-line' }[tone]
  const fg = { fail: 'text-fail-fg', pass: 'text-pass-fg', not_checked: 'text-nc-fg' }[tone]
  return (
    <div className={`min-w-[68px] rounded border ${border} px-3 py-1.5 text-center`}>
      <div className={`fig text-lg leading-tight font-medium ${fg}`}>{n}</div>
      <div className="text-[10.5px] text-muted">{label}</div>
    </div>
  )
}
