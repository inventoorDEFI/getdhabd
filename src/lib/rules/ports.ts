/**
 * Storage ports.
 *
 * The loader and the grounding gate depend on these interfaces, not on pg. That
 * keeps the two pieces where silent failures hide testable without a database,
 * which is the only way those tests get run on every change.
 */

import type { CandidateFinding, GroundingRejection } from './grounding'
import type {
  BoundingBox,
  ClauseVerification,
  CodeSystem,
  ReproductionRights,
  GroundableRule,
  RuleScope,
  RuleSeverity,
  RuleStatus,
} from './types'

// --- writing the corpus -----------------------------------------------------

export interface DocumentUpsert {
  readonly codeSystem: CodeSystem
  readonly docCode: string
  readonly editionYear: number
  readonly titleAr: string
  readonly titleEn: string | null
  readonly sourceFileName: string
  readonly sourceSha256: string
  readonly sourceUrl: string | null
  readonly totalPages: number | null
  readonly jurisdiction: string
  readonly ingestedBy: string
  readonly reproductionRights: ReproductionRights
  readonly rightsNote: string | null
  readonly rightsConfirmedBy: string | null
}

export interface ClauseInsert {
  readonly documentId: string
  readonly clauseNumber: string
  readonly clausePath: readonly string[]
  readonly partNumber: string | null
  readonly chapterNumber: string | null
  readonly sectionNumber: string | null
  readonly headingAr: string | null
  readonly headingEn: string | null
  readonly textAr: string
  readonly textEn: string | null
  readonly textArNormalised: string
  readonly pageNumber: number
  readonly bbox: BoundingBox | null
}

export interface RuleInsert {
  readonly clauseId: string
  readonly ruleKey: string
  readonly checkType: string
  readonly buildingType: string
  readonly zoneCode: string | null
  readonly jurisdiction: string
  readonly parameters: Readonly<Record<string, unknown>>
  readonly unit: string | null
  readonly severity: RuleSeverity
  readonly appliesWhen: Readonly<Record<string, unknown>>
  readonly summaryAr: string | null
  readonly summaryEn: string | null
  /**
   * Always 'draft' from the loader. Activation is a separate, human act, because
   * activation is the moment a clause becomes something an engineer will rely on.
   */
  readonly status: RuleStatus
  readonly authoredBy: string
}

export interface CorpusWriter {
  /** Inserts or returns the existing document with the same natural key. */
  upsertDocument(input: DocumentUpsert): Promise<{ id: string; created: boolean }>
  /** Inserts a clause. Rejects a duplicate clause_number within the document. */
  insertClause(input: ClauseInsert): Promise<{ id: string }>
  insertRule(input: RuleInsert): Promise<{ id: string }>
  /** Resolves a clause reference within a document, for rules that cite it. */
  findClauseByNumber(documentId: string, clauseNumber: string): Promise<{ id: string } | null>
  /** Runs the callback in a transaction. A partial corpus load is never committed. */
  transaction<T>(fn: (writer: CorpusWriter) => Promise<T>): Promise<T>
}

// --- reading the corpus -----------------------------------------------------

export interface GroundingRejectionContext {
  readonly reportId?: string | null
  readonly submissionId?: string | null
  readonly modelName?: string | null
}

export interface RulesRepository {
  /**
   * Reads v_groundable_rules. By construction this returns only active rules
   * whose clause is verified, so a caller cannot reach an ungrounded rule.
   */
  listGroundableRules(scope: RuleScope): Promise<GroundableRule[]>

  /** Records suppressed findings. Called for every rejection, without exception. */
  logGroundingRejections(
    rejections: readonly GroundingRejection[],
    context: GroundingRejectionContext,
  ): Promise<void>
}

// --- clause verification ----------------------------------------------------

export interface ClauseVerificationUpdate {
  readonly clauseId: string
  readonly status: ClauseVerification
  readonly verifiedBy: string
  readonly note?: string | null
}

export interface CorpusAdmin {
  setClauseVerification(input: ClauseVerificationUpdate): Promise<void>
  setRuleStatus(ruleId: string, status: RuleStatus): Promise<void>
}

/** Re-exported so call sites need one import. */
export type { CandidateFinding, GroundingRejection }
