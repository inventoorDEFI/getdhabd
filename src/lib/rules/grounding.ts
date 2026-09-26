/**
 * The grounding gate.
 *
 * Everything the model proposes passes through here before it can appear in a
 * report. The gate has one job: guarantee that every surviving finding points at
 * a row in code_clauses, and that the clause text shown to the engineer is the
 * text from that row and not text the model produced.
 *
 * Two properties are worth stating because they are the whole point:
 *
 *   1. The citation on a grounded finding is built solely from the
 *      GroundableRule that the gate resolved. The candidate's own clause text is
 *      never copied into the output. A model that quotes the code from memory
 *      cannot get that quote in front of an engineer.
 *
 *   2. A candidate the gate cannot resolve is dropped and logged. It never
 *      degrades into a finding with a weaker citation. The rule it was aiming at
 *      is then reported as "not checked", so suppression is visible to the
 *      engineer rather than looking like a pass.
 */

import { foldForMatching } from '../arabic/normalise'
import { canonicaliseClauseRef, canonicaliseDocCode } from './clause-ref'
import type { GroundableRule, ReproductionRights, RuleScope } from './types'

// --- input ------------------------------------------------------------------

/** Where on a sheet a finding sits. */
export interface FindingLocation {
  readonly sheetId: string
  readonly sheetLabel: string | null
  readonly pdfPage: number
  /** PDF user space points, origin bottom left, as pdf.js reports them. */
  readonly x: number
  readonly y: number
}

/**
 * A finding as proposed by extraction and matching, before grounding.
 *
 * `quotedClauseText` exists on this type deliberately. Models will produce it
 * whether or not it is asked for, so the shape acknowledges it, and the gate
 * discards it. Leaving it off the type would mean it arrived as an untyped extra
 * field and got spread into the output by some future `...candidate`.
 */
export interface CandidateFinding {
  readonly ruleId?: string | undefined
  readonly ruleKey?: string | undefined
  readonly docCode?: string | undefined
  readonly clauseNumber?: string | undefined
  /** Discarded by the gate. Retained only for divergence diagnostics. */
  readonly quotedClauseText?: string | undefined

  readonly outcome: 'pass' | 'fail'
  readonly observedValue?: number | string | null | undefined
  readonly observedUnit?: string | null | undefined
  readonly requiredValueSeen?: number | string | null | undefined
  /** Short Arabic explanation of what was measured. Not a code quotation. */
  readonly noteAr?: string | undefined
  readonly location?: FindingLocation | null | undefined
  readonly confidence?: number | undefined
}

// --- output -----------------------------------------------------------------

export type GroundingRejectionReason =
  | 'missing_rule_reference'
  | 'unknown_rule'
  | 'ambiguous_rule_reference'
  | 'rule_out_of_scope'
  | 'clause_reference_mismatch'
  | 'document_reference_mismatch'
  | 'fixture_code_not_permitted'
  | 'no_publishable_body'

/**
 * The citation. Every field comes from the loaded document. There is no field
 * on this type that a model can write to.
 */
export interface Citation {
  readonly clauseId: string
  readonly documentId: string
  readonly codeSystem: string
  readonly docCode: string
  readonly editionYear: number
  readonly documentTitleAr: string
  readonly clauseNumber: string
  readonly clauseHeadingAr: string | null
  /**
   * Verbatim clause text, or null when the source document's rights holder does
   * not permit reproduction. Never populated by the model; it comes from the
   * loaded row or it is absent.
   */
  readonly clauseTextAr: string | null
  readonly clauseTextEn: string | null
  /** Dhabt's own restatement, shown when the clause text cannot be. */
  readonly summaryAr: string | null
  readonly summaryEn: string | null
  readonly reproductionRights: ReproductionRights
  /** Where the reader can open the source themselves. */
  readonly sourceUrl: string | null
  /** Page in the source code document, so a reviewer can open and compare. */
  readonly sourcePage: number
  readonly sourceSha256: string
  readonly isFixture: boolean
}

export type LocationConfidence = 'exact' | 'sheet_only' | 'unknown'

export interface GroundedFinding {
  readonly ruleId: string
  readonly ruleKey: string
  readonly checkType: string
  readonly severity: GroundableRule['severity']
  readonly outcome: 'pass' | 'fail'

  readonly observedValue: number | string | null
  readonly observedUnit: string | null
  readonly parameters: Readonly<Record<string, unknown>>
  readonly noteAr: string | null

  readonly citation: Citation

  readonly location: FindingLocation | null
  readonly locationConfidence: LocationConfidence
  readonly confidence: number | null
}

export interface GroundingRejection {
  readonly reason: GroundingRejectionReason
  readonly detail: string
  readonly attemptedRuleKey: string | null
  readonly attemptedDocCode: string | null
  readonly attemptedClauseRef: string | null
  readonly attemptedText: string | null
  readonly rawCandidate: CandidateFinding
}

export type NotCheckedReason =
  | 'no_candidate'
  | 'suppressed_by_grounding'
  | 'insufficient_extraction'

export interface NotCheckedEntry {
  readonly rule: GroundableRule
  readonly reason: NotCheckedReason
  readonly detailAr: string
}

/**
 * A model quoted clause text that does not match the loaded clause. The finding
 * still stands, because the report prints the loaded text regardless. But this
 * is the signal that a model is reciting the code from memory, so it is counted
 * and surfaced to whoever watches the corpus.
 */
export interface QuotedTextDivergence {
  readonly ruleKey: string
  readonly clauseNumber: string
  readonly quoted: string
  readonly loaded: string
}

export interface GroundingResult {
  readonly findings: readonly GroundedFinding[]
  readonly rejections: readonly GroundingRejection[]
  readonly notChecked: readonly NotCheckedEntry[]
  readonly divergences: readonly QuotedTextDivergence[]
}

// --- the gate ---------------------------------------------------------------

const NOT_CHECKED_TEXT_AR: Record<NotCheckedReason, string> = {
  no_candidate: 'لم يتم العثور على بيانات كافية في المخططات لتطبيق هذا البند',
  suppressed_by_grounding: 'تم استبعاد نتيجة غير موثقة بمرجع نظامي محمّل، ولم يتم فحص هذا البند',
  insufficient_extraction: 'البيانات المستخرجة من المخطط غير كافية لإجراء هذا الفحص',
}

export function groundCandidates(
  candidates: readonly CandidateFinding[],
  groundableRules: readonly GroundableRule[],
  scope: RuleScope,
): GroundingResult {
  const byId = new Map<string, GroundableRule>()
  const byKey = new Map<string, GroundableRule[]>()

  for (const rule of groundableRules) {
    byId.set(rule.ruleId, rule)
    const bucket = byKey.get(rule.ruleKey)
    if (bucket) bucket.push(rule)
    else byKey.set(rule.ruleKey, [rule])
  }

  const findings: GroundedFinding[] = []
  const rejections: GroundingRejection[] = []
  const divergences: QuotedTextDivergence[] = []
  const attemptedRuleIds = new Set<string>()
  const suppressedRuleIds = new Set<string>()

  for (const candidate of candidates) {
    const resolved = resolveRule(candidate, byId, byKey, scope)

    if (!resolved.ok) {
      rejections.push(reject(candidate, resolved.reason, resolved.detail))
      // If we know which rule was being aimed at, remember it so the report can
      // say "not checked" rather than silently omitting the row.
      if (resolved.aimedAtRuleId) suppressedRuleIds.add(resolved.aimedAtRuleId)
      continue
    }

    const rule = resolved.rule
    attemptedRuleIds.add(rule.ruleId)

    if (rule.isFixture && scope.allowFixtures !== true) {
      rejections.push(
        reject(
          candidate,
          'fixture_code_not_permitted',
          `rule ${rule.ruleKey} cites fixture document ${rule.docCode}, which cannot appear in a report`,
        ),
      )
      suppressedRuleIds.add(rule.ruleId)
      continue
    }

    // Nothing publishable to show. The database trigger prevents this rule from
    // being active at all, so reaching here means the corpus was changed behind
    // the guards. Suppress rather than render a citation with an empty body.
    if (rule.clauseTextAr == null && (rule.summaryAr == null || rule.summaryAr.trim() === '')) {
      rejections.push(
        reject(
          candidate,
          'no_publishable_body',
          `rule ${rule.ruleKey} cites ${rule.docCode} ${rule.clauseNumber}, whose reproduction rights are ` +
            `${rule.reproductionRights}, and carries no summary to show instead`,
        ),
      )
      suppressedRuleIds.add(rule.ruleId)
      continue
    }

    // Record, then drop, any clause text the model supplied.
    if (candidate.quotedClauseText != null && candidate.quotedClauseText.trim() !== '') {
      if (rule.clauseTextAr != null && !quotedTextMatchesLoaded(candidate.quotedClauseText, rule.clauseTextAr)) {
        divergences.push({
          ruleKey: rule.ruleKey,
          clauseNumber: rule.clauseNumber,
          quoted: candidate.quotedClauseText,
          loaded: rule.clauseTextAr,
        })
      }
    }

    findings.push(buildFinding(candidate, rule))
  }

  // Coverage. Every groundable rule that produced no surviving finding is
  // reported explicitly.
  const reportedRuleIds = new Set(findings.map((f) => f.ruleId))
  const notChecked: NotCheckedEntry[] = []

  for (const rule of groundableRules) {
    if (reportedRuleIds.has(rule.ruleId)) continue
    if (rule.isFixture && scope.allowFixtures !== true) continue

    const reason: NotCheckedReason = suppressedRuleIds.has(rule.ruleId)
      ? 'suppressed_by_grounding'
      : 'no_candidate'

    notChecked.push({ rule, reason, detailAr: NOT_CHECKED_TEXT_AR[reason] })
  }

  return { findings, rejections, notChecked, divergences }
}

// --- resolution -------------------------------------------------------------

type Resolution =
  | { readonly ok: true; readonly rule: GroundableRule }
  | {
      readonly ok: false
      readonly reason: GroundingRejectionReason
      readonly detail: string
      readonly aimedAtRuleId?: string
    }

function resolveRule(
  candidate: CandidateFinding,
  byId: ReadonlyMap<string, GroundableRule>,
  byKey: ReadonlyMap<string, GroundableRule[]>,
  scope: RuleScope,
): Resolution {
  let rule: GroundableRule | undefined

  if (candidate.ruleId != null && candidate.ruleId !== '') {
    rule = byId.get(candidate.ruleId)
    if (!rule) {
      return {
        ok: false,
        reason: 'unknown_rule',
        detail: `ruleId ${candidate.ruleId} is not in the groundable rule set`,
      }
    }
  } else if (candidate.ruleKey != null && candidate.ruleKey !== '') {
    const matches = byKey.get(candidate.ruleKey) ?? []

    if (matches.length === 0) {
      return {
        ok: false,
        reason: 'unknown_rule',
        detail: `ruleKey ${candidate.ruleKey} is not in the groundable rule set`,
      }
    }

    if (matches.length > 1) {
      const narrowed = matches.filter((r) => r.zoneCode === (scope.zoneCode ?? null))
      if (narrowed.length !== 1) {
        return {
          ok: false,
          reason: 'ambiguous_rule_reference',
          detail:
            `ruleKey ${candidate.ruleKey} matches ${matches.length} rules ` +
            `(${matches.map((r) => r.clauseNumber).join(', ')}); a ruleId is required`,
        }
      }
      rule = narrowed[0]!
    } else {
      rule = matches[0]!
    }
  } else {
    return {
      ok: false,
      reason: 'missing_rule_reference',
      detail: 'candidate carries neither ruleId nor ruleKey',
    }
  }

  // Scope. The repository already filters, so reaching this is a programming
  // error somewhere upstream rather than a model error, and it must still not
  // produce a finding.
  if (rule.jurisdiction !== scope.jurisdiction || rule.buildingType !== scope.buildingType) {
    return {
      ok: false,
      reason: 'rule_out_of_scope',
      detail:
        `rule ${rule.ruleKey} applies to ${rule.buildingType}/${rule.jurisdiction}, ` +
        `submission is ${scope.buildingType}/${scope.jurisdiction}`,
      aimedAtRuleId: rule.ruleId,
    }
  }

  // If the candidate named a clause, it must be the rule's clause. A candidate
  // that pairs a real rule with a different clause number is the exact
  // fabrication this product exists to stop, so it is dropped rather than
  // quietly corrected to the rule's own clause.
  if (candidate.clauseNumber != null && candidate.clauseNumber.trim() !== '') {
    const claimed = canonicaliseClauseRef(candidate.clauseNumber)
    const actual = canonicaliseClauseRef(rule.clauseNumber)
    if (claimed !== actual) {
      return {
        ok: false,
        reason: 'clause_reference_mismatch',
        detail:
          `rule ${rule.ruleKey} is grounded in clause ${rule.clauseNumber}, ` +
          `candidate claimed ${candidate.clauseNumber}`,
        aimedAtRuleId: rule.ruleId,
      }
    }
  }

  if (candidate.docCode != null && candidate.docCode.trim() !== '') {
    if (canonicaliseDocCode(candidate.docCode) !== canonicaliseDocCode(rule.docCode)) {
      return {
        ok: false,
        reason: 'document_reference_mismatch',
        detail:
          `rule ${rule.ruleKey} is grounded in ${rule.docCode}, ` +
          `candidate claimed ${candidate.docCode}`,
        aimedAtRuleId: rule.ruleId,
      }
    }
  }

  return { ok: true, rule }
}

// --- construction -----------------------------------------------------------

/**
 * Builds the output finding. Note what is read from `candidate`: the measurement
 * and the location. Everything citation shaped is read from `rule`.
 */
function buildFinding(candidate: CandidateFinding, rule: GroundableRule): GroundedFinding {
  const location = candidate.location ?? null

  return {
    ruleId: rule.ruleId,
    ruleKey: rule.ruleKey,
    checkType: rule.checkType,
    severity: rule.severity,
    outcome: candidate.outcome,

    observedValue: candidate.observedValue ?? null,
    observedUnit: candidate.observedUnit ?? null,
    parameters: rule.parameters,
    noteAr: candidate.noteAr ?? null,

    citation: {
      clauseId: rule.clauseId,
      documentId: rule.documentId,
      codeSystem: rule.codeSystem,
      docCode: rule.docCode,
      editionYear: rule.editionYear,
      documentTitleAr: rule.documentTitleAr,
      clauseNumber: rule.clauseNumber,
      clauseHeadingAr: rule.clauseHeadingAr,
      clauseTextAr: rule.clauseTextAr,
      clauseTextEn: rule.clauseTextEn,
      summaryAr: rule.summaryAr,
      summaryEn: rule.summaryEn,
      reproductionRights: rule.reproductionRights,
      sourceUrl: rule.sourceUrl,
      sourcePage: rule.clausePageNumber,
      sourceSha256: rule.sourceSha256,
      isFixture: rule.isFixture,
    },

    location,
    locationConfidence: locationConfidenceOf(location),
    confidence: candidate.confidence ?? null,
  }
}

/**
 * A finding without a coordinate is still reported, marked as unlocated.
 *
 * Deliberate: suppressing a real setback failure because the extractor could not
 * pin a coordinate would hide a genuine problem, and the citation is what makes
 * the finding trustworthy, not the pixel position. The report says the location
 * is unknown rather than pretending to one.
 */
function locationConfidenceOf(location: FindingLocation | null): LocationConfidence {
  if (location == null) return 'unknown'
  if (Number.isFinite(location.x) && Number.isFinite(location.y)) return 'exact'
  return 'sheet_only'
}

function reject(
  candidate: CandidateFinding,
  reason: GroundingRejectionReason,
  detail: string,
): GroundingRejection {
  return {
    reason,
    detail,
    attemptedRuleKey: candidate.ruleKey ?? null,
    attemptedDocCode: candidate.docCode ?? null,
    attemptedClauseRef: candidate.clauseNumber ?? null,
    attemptedText: candidate.quotedClauseText ?? null,
    rawCandidate: candidate,
  }
}

/**
 * Whether the model's quotation is consistent with the loaded clause. Folded
 * containment in either direction, so quoting a sentence out of a long clause
 * counts as consistent while a paraphrase does not.
 */
function quotedTextMatchesLoaded(quoted: string, loaded: string): boolean {
  const q = foldForMatching(quoted)
  const l = foldForMatching(loaded)
  if (q === '' ) return true
  return l.includes(q) || q.includes(l)
}


// --- what the report may show -----------------------------------------------

export type CitationBodyKind = 'verbatim' | 'restatement'

export interface CitationBody {
  readonly kind: CitationBodyKind
  readonly text: string
}

/**
 * What a report is allowed to print for a citation.
 *
 * Verbatim clause text when the rights holder permits it, otherwise Dhabt's own
 * restatement. Callers should render the kind visibly, because a reader must be
 * able to tell the code's words from ours. Returns null only if a rule reached a
 * report with neither, which the gate suppresses.
 */
export function citationBody(citation: Citation): CitationBody | null {
  if (citation.reproductionRights === 'permitted' && citation.clauseTextAr != null) {
    return { kind: 'verbatim', text: citation.clauseTextAr }
  }
  if (citation.summaryAr != null && citation.summaryAr.trim() !== '') {
    return { kind: 'restatement', text: citation.summaryAr }
  }
  return null
}
