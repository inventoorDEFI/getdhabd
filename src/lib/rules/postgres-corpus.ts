/**
 * Postgres implementation of the corpus ports.
 *
 * Reads go through v_groundable_rules, never through `rules` directly. That is
 * not a style preference: the view is where "active rule with a verified clause"
 * is defined, so querying it means an ungrounded rule is not merely filtered but
 * absent.
 */

import type { Pool, PoolClient } from 'pg'
import type { GroundingRejection } from './grounding'
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
import type { CheckType, GroundableRule, RuleScope, RuleStatus } from './types'

type Queryable = Pick<PoolClient, 'query'>

export class PostgresCorpus implements CorpusWriter, RulesRepository, CorpusAdmin {
  constructor(
    private readonly pool: Pool,
    private readonly db: Queryable = pool,
  ) {}

  // --- CorpusWriter ---------------------------------------------------------

  async upsertDocument(input: DocumentUpsert): Promise<{ id: string; created: boolean }> {
    const { rows } = await this.db.query<{ id: string; created: boolean }>(
      `INSERT INTO code_documents
         (code_system, doc_code, edition_year, title_ar, title_en,
          source_file_name, source_sha256, source_url, total_pages,
          jurisdiction, ingested_by, reproduction_rights, rights_note,
          rights_confirmed_by, rights_confirmed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
               CASE WHEN $12 = 'permitted' THEN now() ELSE NULL END)
       ON CONFLICT (code_system, doc_code, edition_year, jurisdiction)
       DO UPDATE SET source_url = COALESCE(EXCLUDED.source_url, code_documents.source_url)
       RETURNING id, (xmax = 0) AS created`,
      [
        input.codeSystem,
        input.docCode,
        input.editionYear,
        input.titleAr,
        input.titleEn,
        input.sourceFileName,
        input.sourceSha256,
        input.sourceUrl,
        input.totalPages,
        input.jurisdiction,
        input.ingestedBy,
        input.reproductionRights,
        input.rightsNote,
        input.rightsConfirmedBy,
      ],
    )

    const row = rows[0]!

    // A document already present with a different source hash means the corpus
    // was transcribed from a different file than the one now being loaded.
    const { rows: check } = await this.db.query<{ source_sha256: string }>(
      `SELECT source_sha256 FROM code_documents WHERE id = $1`,
      [row.id],
    )
    if (check[0]!.source_sha256 !== input.sourceSha256) {
      throw new Error(
        `document ${input.docCode} ${input.editionYear} is already loaded from a file hashing to ` +
          `${check[0]!.source_sha256}, but this pack declares ${input.sourceSha256}. ` +
          `Load the new edition as a separate edition_year rather than overwriting provenance.`,
      )
    }

    return { id: row.id, created: row.created }
  }

  async insertClause(input: ClauseInsert): Promise<{ id: string }> {
    const { rows } = await this.db.query<{ id: string }>(
      `INSERT INTO code_clauses
         (document_id, clause_number, clause_path, part_number, chapter_number,
          section_number, heading_ar, heading_en, text_ar, text_en,
          text_ar_normalised, page_number, bbox)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      [
        input.documentId,
        input.clauseNumber,
        input.clausePath,
        input.partNumber,
        input.chapterNumber,
        input.sectionNumber,
        input.headingAr,
        input.headingEn,
        input.textAr,
        input.textEn,
        input.textArNormalised,
        input.pageNumber,
        input.bbox == null ? null : JSON.stringify(input.bbox),
      ],
    )
    return { id: rows[0]!.id }
  }

  async insertRule(input: RuleInsert): Promise<{ id: string }> {
    const { rows } = await this.db.query<{ id: string }>(
      `INSERT INTO rules
         (clause_id, rule_key, check_type, building_type, zone_code, jurisdiction,
          parameters, unit, severity, applies_when, status, authored_by,
          summary_ar, summary_en)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        input.clauseId,
        input.ruleKey,
        input.checkType,
        input.buildingType,
        input.zoneCode,
        input.jurisdiction,
        JSON.stringify(input.parameters),
        input.unit,
        input.severity,
        JSON.stringify(input.appliesWhen),
        input.status,
        input.authoredBy,
        input.summaryAr,
        input.summaryEn,
      ],
    )
    return { id: rows[0]!.id }
  }

  async findClauseByNumber(
    documentId: string,
    clauseNumber: string,
  ): Promise<{ id: string } | null> {
    const { rows } = await this.db.query<{ id: string }>(
      `SELECT id FROM code_clauses WHERE document_id = $1 AND clause_number = $2`,
      [documentId, clauseNumber],
    )
    return rows[0] ?? null
  }

  async transaction<T>(fn: (writer: CorpusWriter) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await fn(new PostgresCorpus(this.pool, client))
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  // --- CorpusAdmin ---------------------------------------------------------

  async setClauseVerification(input: ClauseVerificationUpdate): Promise<void> {
    const verified = input.status === 'verified'
    const { rowCount } = await this.db.query(
      `UPDATE code_clauses
          SET verification_status = $2,
              verified_by       = CASE WHEN $3 THEN $4 ELSE verified_by END,
              verified_at       = CASE WHEN $3 THEN now() ELSE verified_at END,
              verification_note = COALESCE($5, verification_note)
        WHERE id = $1`,
      [input.clauseId, input.status, verified, input.verifiedBy, input.note ?? null],
    )
    if (rowCount === 0) throw new Error(`clause ${input.clauseId} does not exist`)
  }

  async setRuleStatus(ruleId: string, status: RuleStatus): Promise<void> {
    const { rowCount } = await this.db.query(`UPDATE rules SET status = $2 WHERE id = $1`, [
      ruleId,
      status,
    ])
    if (rowCount === 0) throw new Error(`rule ${ruleId} does not exist`)
  }

  // --- RulesRepository -----------------------------------------------------

  async listGroundableRules(scope: RuleScope): Promise<GroundableRule[]> {
    const { rows } = await this.db.query<GroundableRuleRow>(
      `SELECT * FROM v_groundable_rules
        WHERE building_type = $1
          AND jurisdiction  = $2
          AND (zone_code IS NULL OR zone_code = $3)
          AND (is_fixture = false OR $4 = true)
        ORDER BY rule_key`,
      [scope.buildingType, scope.jurisdiction, scope.zoneCode ?? null, scope.allowFixtures === true],
    )

    return rows.map(toGroundableRule)
  }

  async logGroundingRejections(
    rejections: readonly GroundingRejection[],
    context: GroundingRejectionContext,
  ): Promise<void> {
    if (rejections.length === 0) return

    // One statement, so logging cannot partially fail and leave a suppressed
    // finding with no trace of why it vanished.
    const values: unknown[] = []
    const tuples = rejections.map((rejection, i) => {
      const base = i * 9
      values.push(
        context.reportId ?? null,
        context.submissionId ?? null,
        rejection.reason,
        rejection.attemptedClauseRef,
        rejection.attemptedDocCode,
        rejection.attemptedRuleKey,
        rejection.attemptedText,
        JSON.stringify({ detail: rejection.detail, candidate: rejection.rawCandidate }),
        context.modelName ?? null,
      )
      return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9})`
    })

    await this.db.query(
      `INSERT INTO grounding_rejections
         (report_id, submission_id, reason, attempted_clause_ref, attempted_doc_code,
          attempted_rule_key, attempted_text, raw_candidate, model_name)
       VALUES ${tuples.join(',')}`,
      values,
    )
  }
}

// --- row mapping ------------------------------------------------------------

interface GroundableRuleRow {
  rule_id: string
  rule_key: string
  check_type: string
  building_type: string
  zone_code: string | null
  jurisdiction: string
  parameters: Record<string, unknown>
  unit: string | null
  severity: GroundableRule['severity']
  applies_when: Record<string, unknown>
  summary_ar: string | null
  summary_en: string | null
  clause_id: string
  clause_number: string
  heading_ar: string | null
  heading_en: string | null
  clause_text_ar: string | null
  clause_text_en: string | null
  reproduction_rights: GroundableRule['reproductionRights']
  page_number: number
  bbox: GroundableRule['clauseBbox']
  document_id: string
  code_system: GroundableRule['codeSystem']
  doc_code: string
  edition_year: number
  document_title_ar: string
  source_url: string | null
  source_sha256: string
  is_fixture: boolean
}

function toGroundableRule(row: GroundableRuleRow): GroundableRule {
  return {
    ruleId: row.rule_id,
    ruleKey: row.rule_key,
    checkType: row.check_type as CheckType,
    buildingType: row.building_type,
    zoneCode: row.zone_code,
    jurisdiction: row.jurisdiction,
    parameters: row.parameters,
    unit: row.unit,
    severity: row.severity,
    appliesWhen: row.applies_when,
    summaryAr: row.summary_ar,
    summaryEn: row.summary_en,

    clauseId: row.clause_id,
    clauseNumber: row.clause_number,
    clauseHeadingAr: row.heading_ar,
    clauseHeadingEn: row.heading_en,
    clauseTextAr: row.clause_text_ar,
    clauseTextEn: row.clause_text_en,
    reproductionRights: row.reproduction_rights,
    clausePageNumber: row.page_number,
    clauseBbox: row.bbox,

    documentId: row.document_id,
    codeSystem: row.code_system,
    docCode: row.doc_code,
    editionYear: row.edition_year,
    documentTitleAr: row.document_title_ar,
    sourceUrl: row.source_url,
    sourceSha256: row.source_sha256,
    isFixture: row.is_fixture,
  }
}
