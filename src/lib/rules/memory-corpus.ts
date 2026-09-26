/**
 * In-memory corpus.
 *
 * Mirrors every invariant that db/migrations/0001_code_rules.sql enforces, so
 * the grounding guarantees can be tested on every commit without a database.
 * The Postgres implementation is the production path and scripts/verify-guards.ts
 * asserts the SQL enforces the same things; if the two ever disagree, that script
 * is what catches it.
 */

import { randomUUID } from 'node:crypto'
import type {
  ClauseInsert,
  ClauseVerificationUpdate,
  CorpusAdmin,
  CorpusWriter,
  DocumentUpsert,
  GroundingRejectionContext,
  RuleInsert,
  RulesRepository,
} from './ports'
import type { GroundingRejection } from './grounding'
import type {
  ClauseVerification,
  CodeClauseRecord,
  CodeDocumentRecord,
  CheckType,
  GroundableRule,
  RuleScope,
  RuleStatus,
} from './types'

export class CorpusIntegrityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CorpusIntegrityError'
  }
}

interface StoredRule extends RuleInsert {
  readonly id: string
}

export interface LoggedRejection {
  readonly rejection: GroundingRejection
  readonly context: GroundingRejectionContext
}

export class MemoryCorpus implements CorpusWriter, RulesRepository, CorpusAdmin {
  readonly documents = new Map<string, CodeDocumentRecord>()
  readonly clauses = new Map<string, CodeClauseRecord>()
  readonly rules = new Map<string, StoredRule>()
  readonly rejectionLog: LoggedRejection[] = []

  // --- CorpusWriter ---------------------------------------------------------

  async upsertDocument(input: DocumentUpsert): Promise<{ id: string; created: boolean }> {
    const naturalKey = [
      input.codeSystem,
      input.docCode,
      input.editionYear,
      input.jurisdiction,
    ].join('|')

    for (const [id, doc] of this.documents) {
      const existing = [doc.codeSystem, doc.docCode, doc.editionYear, doc.jurisdiction].join('|')
      if (existing === naturalKey) return { id, created: false }
    }

    const id = randomUUID()
    this.documents.set(id, {
      id,
      codeSystem: input.codeSystem,
      docCode: input.docCode,
      editionYear: input.editionYear,
      titleAr: input.titleAr,
      titleEn: input.titleEn,
      sourceFileName: input.sourceFileName,
      sourceSha256: input.sourceSha256,
      sourceUrl: input.sourceUrl,
      totalPages: input.totalPages,
      jurisdiction: input.jurisdiction,
      reproductionRights: input.reproductionRights,
      // Generated column in SQL; same derivation here.
      isFixture: input.codeSystem === 'FIXTURE',
    })

    return { id, created: true }
  }

  async insertClause(input: ClauseInsert): Promise<{ id: string }> {
    if (this.documents.get(input.documentId) == null) {
      throw new CorpusIntegrityError(`document ${input.documentId} does not exist`)
    }

    // UNIQUE (document_id, clause_number)
    for (const clause of this.clauses.values()) {
      if (clause.documentId === input.documentId && clause.clauseNumber === input.clauseNumber) {
        throw new CorpusIntegrityError(
          `clause ${input.clauseNumber} already exists in document ${input.documentId}`,
        )
      }
    }

    // CHECK constraints on text_ar
    if (input.textAr.trim() === '') {
      throw new CorpusIntegrityError('text_ar must not be blank')
    }
    if (input.textAr.includes('<<TRANSCRIBE')) {
      throw new CorpusIntegrityError('text_ar still contains a transcription placeholder')
    }
    if (input.pageNumber <= 0) {
      throw new CorpusIntegrityError('page_number must be positive')
    }

    const id = randomUUID()
    this.clauses.set(id, {
      id,
      documentId: input.documentId,
      clauseNumber: input.clauseNumber,
      clausePath: input.clausePath,
      partNumber: input.partNumber,
      chapterNumber: input.chapterNumber,
      sectionNumber: input.sectionNumber,
      headingAr: input.headingAr,
      headingEn: input.headingEn,
      textAr: input.textAr,
      textEn: input.textEn,
      textArNormalised: input.textArNormalised,
      pageNumber: input.pageNumber,
      bbox: input.bbox,
      verificationStatus: 'unverified',
      verifiedBy: null,
      verifiedAt: null,
    })

    return { id }
  }

  async insertRule(input: RuleInsert): Promise<{ id: string }> {
    const clause = this.clauses.get(input.clauseId)
    if (clause == null) {
      // FK NOT NULL REFERENCES code_clauses
      throw new CorpusIntegrityError(`clause ${input.clauseId} does not exist`)
    }

    this.assertRuleActivatable(input.status, input.clauseId, input.ruleKey)
    this.assertRulePublishable(input.status, input.clauseId, input.ruleKey, input.summaryAr)

    const id = randomUUID()
    this.rules.set(id, { ...input, id })
    return { id }
  }

  async findClauseByNumber(
    documentId: string,
    clauseNumber: string,
  ): Promise<{ id: string } | null> {
    for (const clause of this.clauses.values()) {
      if (clause.documentId === documentId && clause.clauseNumber === clauseNumber) {
        return { id: clause.id }
      }
    }
    return null
  }

  /**
   * Snapshot and restore. Crude next to a real transaction, but it gives the same
   * observable property: a failed load leaves nothing behind.
   */
  async transaction<T>(fn: (writer: CorpusWriter) => Promise<T>): Promise<T> {
    const snapshot = {
      documents: new Map(this.documents),
      clauses: new Map(this.clauses),
      rules: new Map(this.rules),
    }

    try {
      return await fn(this)
    } catch (error) {
      this.documents.clear()
      this.clauses.clear()
      this.rules.clear()
      for (const [k, v] of snapshot.documents) this.documents.set(k, v)
      for (const [k, v] of snapshot.clauses) this.clauses.set(k, v)
      for (const [k, v] of snapshot.rules) this.rules.set(k, v)
      throw error
    }
  }

  // --- CorpusAdmin ---------------------------------------------------------

  async setClauseVerification(input: ClauseVerificationUpdate): Promise<void> {
    const clause = this.clauses.get(input.clauseId)
    if (clause == null) {
      throw new CorpusIntegrityError(`clause ${input.clauseId} does not exist`)
    }

    // CONSTRAINT clause_verified_needs_attribution
    if (input.status === 'verified' && input.verifiedBy.trim() === '') {
      throw new CorpusIntegrityError('a verified clause must record who verified it')
    }

    // TRIGGER clauses_protect_cited_verification
    if (clause.verificationStatus === 'verified' && input.status !== 'verified') {
      const citing = [...this.rules.values()].filter(
        (r) => r.clauseId === clause.id && r.status === 'active',
      )
      if (citing.length > 0) {
        throw new CorpusIntegrityError(
          `clause ${clause.clauseNumber} cannot move from verified to ${input.status}: ` +
            `${citing.length} active rule(s) cite it. Retire those rules first`,
        )
      }
    }

    this.clauses.set(clause.id, {
      ...clause,
      verificationStatus: input.status,
      verifiedBy: input.status === 'verified' ? input.verifiedBy : clause.verifiedBy,
      verifiedAt: input.status === 'verified' ? new Date() : clause.verifiedAt,
    })
  }

  async setRuleStatus(ruleId: string, status: RuleStatus): Promise<void> {
    const rule = this.rules.get(ruleId)
    if (rule == null) throw new CorpusIntegrityError(`rule ${ruleId} does not exist`)

    this.assertRuleActivatable(status, rule.clauseId, rule.ruleKey)
    this.assertRulePublishable(status, rule.clauseId, rule.ruleKey, rule.summaryAr)
    this.rules.set(ruleId, { ...rule, status })
  }

  // --- RulesRepository -----------------------------------------------------

  /** The in-memory equivalent of selecting from v_groundable_rules. */
  async listGroundableRules(scope: RuleScope): Promise<GroundableRule[]> {
    const out: GroundableRule[] = []

    for (const rule of this.rules.values()) {
      if (rule.status !== 'active') continue

      const clause = this.clauses.get(rule.clauseId)
      if (clause == null || clause.verificationStatus !== 'verified') continue

      const document = this.documents.get(clause.documentId)
      if (document == null) continue

      if (document.isFixture && scope.allowFixtures !== true) continue
      if (rule.buildingType !== scope.buildingType) continue
      if (rule.jurisdiction !== scope.jurisdiction) continue
      if (rule.zoneCode != null && rule.zoneCode !== (scope.zoneCode ?? null)) continue

      out.push({
        ruleId: rule.id,
        ruleKey: rule.ruleKey,
        checkType: rule.checkType as CheckType,
        buildingType: rule.buildingType,
        zoneCode: rule.zoneCode,
        jurisdiction: rule.jurisdiction,
        parameters: rule.parameters,
        unit: rule.unit,
        severity: rule.severity,
        appliesWhen: rule.appliesWhen,
        summaryAr: rule.summaryAr,
        summaryEn: rule.summaryEn,

        clauseId: clause.id,
        clauseNumber: clause.clauseNumber,
        clauseHeadingAr: clause.headingAr,
        clauseHeadingEn: clause.headingEn,
        // Mirrors the CASE expression in v_groundable_rules: text only leaves
        // the corpus when the rights holder permits it.
        clauseTextAr: document.reproductionRights === 'permitted' ? clause.textAr : null,
        clauseTextEn: document.reproductionRights === 'permitted' ? clause.textEn : null,
        reproductionRights: document.reproductionRights,
        clausePageNumber: clause.pageNumber,
        clauseBbox: clause.bbox,

        documentId: document.id,
        codeSystem: document.codeSystem,
        docCode: document.docCode,
        editionYear: document.editionYear,
        documentTitleAr: document.titleAr,
        sourceUrl: document.sourceUrl,
        sourceSha256: document.sourceSha256,
        isFixture: document.isFixture,
      })
    }

    return out
  }

  async logGroundingRejections(
    rejections: readonly GroundingRejection[],
    context: GroundingRejectionContext,
  ): Promise<void> {
    for (const rejection of rejections) {
      this.rejectionLog.push({ rejection, context })
    }
  }

  // --- shared guard --------------------------------------------------------

  /** TRIGGER rules_require_publishable_body */
  private assertRulePublishable(
    status: RuleStatus,
    clauseId: string,
    ruleKey: string,
    summaryAr: string | null,
  ): void {
    if (status !== 'active') return

    const clause = this.clauses.get(clauseId)
    const document = clause == null ? undefined : this.documents.get(clause.documentId)
    const rights = document?.reproductionRights ?? 'unknown'

    if (rights !== 'permitted' && (summaryAr == null || summaryAr.trim() === '')) {
      throw new CorpusIntegrityError(
        `rule ${ruleKey} cannot be active: clause ${clause?.clauseNumber ?? clauseId} comes from a ` +
          `document whose reproduction rights are ${rights}, so the report cannot print its text, ` +
          'and no summary_ar was written to show instead',
      )
    }
  }

  /** TRIGGER rules_require_verified_clause */
  private assertRuleActivatable(
    status: RuleStatus,
    clauseId: string,
    ruleKey: string,
  ): void {
    if (status !== 'active') return

    const clause = this.clauses.get(clauseId)
    const clauseStatus: ClauseVerification = clause?.verificationStatus ?? 'unverified'

    if (clauseStatus !== 'verified') {
      throw new CorpusIntegrityError(
        `rule ${ruleKey} cannot be active: clause ${clause?.clauseNumber ?? clauseId} is ${clauseStatus}, not verified`,
      )
    }
  }
}
