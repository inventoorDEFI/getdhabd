import { citationBody, type Citation } from '@/lib/rules/grounding'
import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'

/**
 * The citation block.
 *
 * Two modes, and the reader is always told which one they are looking at:
 *
 *   verbatim     the clause text as printed, shown only when the rights holder
 *                permits reproduction
 *   restatement  Dhabt's own wording of the requirement, shown when they do not
 *
 * Labelling this is not decoration. An engineer deciding whether to move a wall
 * needs to know whether the sentence in front of them is the regulation or our
 * paraphrase of it, and in the second case they need the link to go and read the
 * regulation themselves.
 *
 * Every field comes from the Citation, which the gate builds only from a loaded
 * clause row. There is no prop here that accepts free text.
 */
export function ClauseQuote({ citation, lang }: { citation: Citation; lang: Lang }) {
  const body = citationBody(citation)
  if (body == null) return null

  const verbatim = body.kind === 'verbatim'

  return (
    <figure
      className={`m-0 rounded-e bg-sunken px-4 py-3 border-s-[3px] ${
        verbatim ? 'border-s-ink' : 'border-s-line-strong'
      }`}
    >
      <figcaption className="mono mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-muted">
        <span>
          {t('clause', lang)} <span className="fig">{citation.clauseNumber}</span>
        </span>
        <span>
          {t('page', lang)} <span className="fig">{citation.sourcePage}</span>
        </span>
        <span className="latin">{citation.docCode}</span>
        {citation.isFixture ? (
          <span className="rounded-sm bg-nc-line px-1.5 text-ink">FIXTURE</span>
        ) : null}
        <span
          className={`rounded-sm border px-1.5 ${
            verbatim ? 'border-ink text-ink' : 'border-line-strong text-muted'
          }`}
        >
          {verbatim ? t('verbatimLabel', lang) : t('restatementLabel', lang)}
        </span>
      </figcaption>

      {verbatim ? (
        <blockquote className="m-0 text-[14px] leading-[1.85] text-ink">{body.text}</blockquote>
      ) : (
        <p className="m-0 text-[14px] leading-[1.85] text-ink">{body.text}</p>
      )}

      {!verbatim ? (
        <p className="mt-2 text-[11.5px] text-muted">
          {t('restatementNote', lang)}
          {citation.sourceUrl ? (
            <>
              {' '}
              <a
                href={citation.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-ink"
              >
                {t('openSource', lang)}
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      {citation.clauseHeadingAr ? (
        <div className="mt-1.5 text-[11.5px] text-muted">{citation.clauseHeadingAr}</div>
      ) : null}
    </figure>
  )
}
