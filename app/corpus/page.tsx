import { Chrome, langFrom } from '@/components/Chrome'
import { getDemoReport } from '@/lib/demo/corpus'
import { checkName, t } from '@/lib/i18n'

/**
 * What the system can actually check right now.
 *
 * This page exists because "not checked" should never be a surprise. An engineer
 * can see the whole checkable surface before running anything.
 */
export default async function CorpusPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const lang = langFrom(await searchParams)
  const report = await getDemoReport()
  const rules = [...report.groundableRules].sort((a, b) => a.ruleKey.localeCompare(b.ruleKey))
  const isFixture = rules.some((r) => r.isFixture)

  return (
    <Chrome lang={lang} current="corpus">
      <section className="grid gap-3 pt-10 pb-6">
        <h1 className="text-[26px] font-semibold tracking-tight">{t('corpusTitle', lang)}</h1>
        <p className="max-w-[64ch] text-[14.5px] text-muted">{t('corpusBody', lang)}</p>
        {isFixture ? (
          <p className="max-w-[64ch] rounded-md border border-fail-line bg-fail-bg px-4 py-3 text-[13.5px] text-fail-fg">
            {t('fixtureWarning', lang)}
          </p>
        ) : null}
      </section>

      <div className="overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full border-collapse text-start text-[13.5px]">
          <thead>
            <tr className="border-b border-line bg-sunken">
              <Th>{t('ruleKey', lang)}</Th>
              <Th>{t('clause', lang)}</Th>
              <Th>{lang === 'ar' ? 'الفحص' : 'Check'}</Th>
              <Th>{t('page', lang)}</Th>
              <Th>{lang === 'ar' ? 'الحالة' : 'Status'}</Th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.ruleId} className="border-b border-line last:border-b-0">
                <Td>
                  <span className="fig">{r.ruleKey}</span>
                </Td>
                <Td>
                  <span className="fig">{r.clauseNumber}</span>
                </Td>
                <Td>{checkName(r.ruleKey, lang)}</Td>
                <Td>
                  <span className="fig">{r.clausePageNumber}</span>
                </Td>
                <Td>
                  <span className="rounded-sm border border-pass-line bg-pass-bg px-2 py-0.5 text-[11px] font-medium text-pass-fg">
                    {t('verified', lang)}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Chrome>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-start text-[11.5px] font-medium tracking-wide text-muted">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2.5 align-top">{children}</td>
}
