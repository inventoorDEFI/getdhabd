/**
 * Asserts that the database enforces the grounding invariants, not just the
 * TypeScript.
 *
 * Usage: npm run db:verify-guards
 *
 * tests/corpus-invariants.test.ts asserts these same properties against the
 * in-memory implementation on every commit. This script asserts them against real
 * SQL. If the two ever drift, this is what catches it, so run it after any change
 * to db/migrations.
 *
 * Everything happens inside a transaction that is always rolled back, so it is
 * safe to run against a database that holds a real corpus.
 */
import type { PoolClient, QueryResult, QueryResultRow } from 'pg'
import { closePool, getPool } from '../src/lib/db/client'

class GuardFailure extends Error {}

/**
 * A rejected statement leaves the transaction aborted, so every expectation that
 * a statement fails has to be wrapped in its own savepoint and rolled back to it.
 * Statements that are expected to succeed are also undone, so one check cannot
 * change what the next one sees.
 */
class GuardContext {
  private counter = 0

  constructor(private readonly client: PoolClient) {}

  async q<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.client.query<T>(sql, params)
  }

  async expectRejection(
    what: string,
    matching: RegExp,
    sql: string,
    params?: unknown[],
  ): Promise<void> {
    const savepoint = `guard_expect_${this.counter++}`
    await this.client.query(`SAVEPOINT ${savepoint}`)

    let error: unknown
    try {
      await this.client.query(sql, params)
    } catch (caught) {
      error = caught
    }

    // Unwind either way: after a rejection the transaction is aborted, and after
    // an unexpected success the row has to go.
    await this.client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`)

    if (error === undefined) {
      throw new GuardFailure(`${what}: the database allowed it`)
    }

    const message = error instanceof Error ? error.message : String(error)
    if (!matching.test(message)) {
      throw new GuardFailure(
        `${what}: rejected, but not for the expected reason. Message was: ${message}`,
      )
    }
  }
}

const GUARD_DOC = `(SELECT id FROM code_documents WHERE doc_code = 'GUARD-TEST')`
const GUARD_CLAUSE = `(SELECT c.id FROM code_clauses c
                         JOIN code_documents d ON d.id = c.document_id
                        WHERE d.doc_code = 'GUARD-TEST' AND c.clause_number = 'G.1')`

interface Check {
  readonly name: string
  readonly run: (ctx: GuardContext) => Promise<void>
}

const CHECKS: Check[] = [
  {
    name: 'a clause cannot carry placeholder text',
    run: (ctx) =>
      ctx.expectRejection(
        'placeholder clause text',
        /violates check constraint/i,
        `INSERT INTO code_clauses
           (document_id, clause_number, clause_path, text_ar, text_ar_normalised, page_number)
         VALUES (${GUARD_DOC}, 'G.9', ARRAY['g','9'], '<<TRANSCRIBE>>', 'x', 1)`,
      ),
  },
  {
    name: 'a clause cannot carry blank text',
    run: (ctx) =>
      ctx.expectRejection(
        'blank clause text',
        /violates check constraint/i,
        `INSERT INTO code_clauses
           (document_id, clause_number, clause_path, text_ar, text_ar_normalised, page_number)
         VALUES (${GUARD_DOC}, 'G.8', ARRAY['g','8'], '   ', 'x', 1)`,
      ),
  },
  {
    name: 'a clause cannot carry a non positive page number',
    run: (ctx) =>
      ctx.expectRejection(
        'zero page number',
        /violates check constraint/i,
        `INSERT INTO code_clauses
           (document_id, clause_number, clause_path, text_ar, text_ar_normalised, page_number)
         VALUES (${GUARD_DOC}, 'G.7', ARRAY['g','7'], 'نص', 'نص', 0)`,
      ),
  },
  {
    name: 'a duplicate clause number in one document is refused',
    run: (ctx) =>
      ctx.expectRejection(
        'duplicate clause number',
        /duplicate key value|unique constraint/i,
        `INSERT INTO code_clauses
           (document_id, clause_number, clause_path, text_ar, text_ar_normalised, page_number)
         VALUES (${GUARD_DOC}, 'G.1', ARRAY['g','1'], 'نص آخر', 'نص اخر', 2)`,
      ),
  },
  {
    name: 'a clause cannot be verified without a named verifier',
    run: (ctx) =>
      ctx.expectRejection(
        'verification with no verifier',
        /clause_verified_needs_attribution/i,
        `UPDATE code_clauses SET verification_status = 'verified'
          WHERE id = ${GUARD_CLAUSE}`,
      ),
  },
  {
    name: 'a rule cannot be inserted active against an unverified clause',
    run: (ctx) =>
      ctx.expectRejection(
        'inserting an active rule on an unverified clause',
        /not verified/i,
        `INSERT INTO rules
           (clause_id, rule_key, check_type, building_type, parameters, status, authored_by)
         VALUES (${GUARD_CLAUSE}, 'guard.test.min', 'setback.min', 'residential_villa',
                 '{}'::jsonb, 'active', 'guard')`,
      ),
  },
  {
    name: 'a draft rule cannot be promoted to active against an unverified clause',
    run: async (ctx) => {
      await ctx.q(
        `INSERT INTO rules
           (clause_id, rule_key, check_type, building_type, parameters, status, authored_by)
         VALUES (${GUARD_CLAUSE}, 'guard.promote.min', 'setback.min', 'residential_villa',
                 '{}'::jsonb, 'draft', 'guard')`,
      )
      await ctx.expectRejection(
        'promoting a draft rule on an unverified clause',
        /not verified/i,
        `UPDATE rules SET status = 'active' WHERE rule_key = 'guard.promote.min'`,
      )
    },
  },
  {
    name: 'a rule key must be dotted lowercase',
    run: (ctx) =>
      ctx.expectRejection(
        'a rule key with spaces and capitals',
        /violates check constraint/i,
        `INSERT INTO rules
           (clause_id, rule_key, check_type, building_type, parameters, status, authored_by)
         VALUES (${GUARD_CLAUSE}, 'Setback Front Min', 'setback.min', 'residential_villa',
                 '{}'::jsonb, 'draft', 'guard')`,
      ),
  },
  {
    name: 'a rule cannot exist without a clause',
    run: (ctx) =>
      ctx.expectRejection(
        'a rule with a null clause',
        /null value in column "clause_id"|violates not-null/i,
        `INSERT INTO rules
           (clause_id, rule_key, check_type, building_type, parameters, status, authored_by)
         VALUES (NULL, 'guard.orphan.min', 'setback.min', 'residential_villa',
                 '{}'::jsonb, 'draft', 'guard')`,
      ),
  },
  {
    name: 'a verified clause cannot be unverified while an active rule cites it',
    run: async (ctx) => {
      await ctx.q(
        `UPDATE code_clauses
            SET verification_status = 'verified', verified_by = 'guard', verified_at = now()
          WHERE id = ${GUARD_CLAUSE}`,
      )
      await ctx.q(
        `INSERT INTO rules
           (clause_id, rule_key, check_type, building_type, parameters, status, authored_by)
         VALUES (${GUARD_CLAUSE}, 'guard.cited.min', 'setback.min', 'residential_villa',
                 '{}'::jsonb, 'active', 'guard')`,
      )
      await ctx.expectRejection(
        'unverifying a clause an active rule cites',
        /active rule/i,
        `UPDATE code_clauses SET verification_status = 'unverified' WHERE id = ${GUARD_CLAUSE}`,
      )
      await ctx.expectRejection(
        'superseding a clause an active rule cites',
        /active rule/i,
        `UPDATE code_clauses SET verification_status = 'superseded' WHERE id = ${GUARD_CLAUSE}`,
      )
    },
  },
  {
    name: 'a cited clause cannot be deleted',
    run: async (ctx) => {
      await ctx.q(
        `UPDATE code_clauses
            SET verification_status = 'verified', verified_by = 'guard', verified_at = now()
          WHERE id = ${GUARD_CLAUSE}`,
      )
      await ctx.q(
        `INSERT INTO rules
           (clause_id, rule_key, check_type, building_type, parameters, status, authored_by)
         VALUES (${GUARD_CLAUSE}, 'guard.delete.min', 'setback.min', 'residential_villa',
                 '{}'::jsonb, 'active', 'guard')`,
      )
      await ctx.expectRejection(
        'deleting a cited clause',
        /violates foreign key constraint/i,
        `DELETE FROM code_clauses WHERE id = ${GUARD_CLAUSE}`,
      )
    },
  },
  {
    name: 'the groundable view shows a rule only when both halves are done',
    run: async (ctx) => {
      const draftOnly = await ctx.q(
        `SELECT 1 FROM v_groundable_rules WHERE rule_key = 'guard.view.min'`,
      )
      if (draftOnly.rowCount !== 0) {
        throw new GuardFailure('the view exposed a rule that was never created')
      }

      await ctx.q(
        `UPDATE code_clauses
            SET verification_status = 'verified', verified_by = 'guard', verified_at = now()
          WHERE id = ${GUARD_CLAUSE}`,
      )
      await ctx.q(
        `INSERT INTO rules
           (clause_id, rule_key, check_type, building_type, parameters, status, authored_by)
         VALUES (${GUARD_CLAUSE}, 'guard.view.min', 'setback.min', 'residential_villa',
                 '{}'::jsonb, 'draft', 'guard')`,
      )

      const stillDraft = await ctx.q(
        `SELECT 1 FROM v_groundable_rules WHERE rule_key = 'guard.view.min'`,
      )
      if (stillDraft.rowCount !== 0) {
        throw new GuardFailure('the view exposed a draft rule')
      }

      await ctx.q(`UPDATE rules SET status = 'active' WHERE rule_key = 'guard.view.min'`)

      const active = await ctx.q<{ clause_text_ar: string; is_fixture: boolean }>(
        `SELECT clause_text_ar, is_fixture FROM v_groundable_rules WHERE rule_key = 'guard.view.min'`,
      )
      if (active.rowCount !== 1) {
        throw new GuardFailure(`expected 1 groundable rule, saw ${active.rowCount}`)
      }
      if (!active.rows[0]!.clause_text_ar) {
        throw new GuardFailure('the view returned a rule with no clause text')
      }
      if (!active.rows[0]!.is_fixture) {
        throw new GuardFailure('the guard document should be flagged as a fixture')
      }

      await ctx.q(`UPDATE rules SET status = 'retired' WHERE rule_key = 'guard.view.min'`)
      const retired = await ctx.q(
        `SELECT 1 FROM v_groundable_rules WHERE rule_key = 'guard.view.min'`,
      )
      if (retired.rowCount !== 0) {
        throw new GuardFailure('a retired rule is still groundable')
      }
    },
  },
]

async function main(): Promise<void> {
  const pool = getPool()
  const client = await pool.connect()
  const ctx = new GuardContext(client)

  let failures = 0

  try {
    await client.query('BEGIN')

    await client.query(
      `INSERT INTO code_documents
         (code_system, doc_code, edition_year, title_ar, source_file_name, source_sha256, ingested_by)
       VALUES ('FIXTURE', 'GUARD-TEST', 2025, 'مستند اختبار الحواجز', 'guard.pdf', $1, 'guard')`,
      ['0'.repeat(64)],
    )
    await client.query(
      `INSERT INTO code_clauses
         (document_id, clause_number, clause_path, text_ar, text_ar_normalised, page_number)
       VALUES (${GUARD_DOC}, 'G.1', ARRAY['g','1'], 'نص اختبار', 'نص اختبار', 1)`,
    )

    for (const check of CHECKS) {
      await client.query('SAVEPOINT guard_check')
      try {
        await check.run(ctx)
        console.log(`  ok    ${check.name}`)
      } catch (error) {
        failures++
        console.log(`  FAIL  ${check.name}`)
        console.log(`        ${error instanceof Error ? error.message : String(error)}`)
      }
      // Always unwind, so each check starts from the same fixture state.
      await client.query('ROLLBACK TO SAVEPOINT guard_check')
    }
  } finally {
    await client.query('ROLLBACK')
    client.release()
  }

  console.log('')
  console.log(
    failures === 0
      ? `all ${CHECKS.length} database guards hold`
      : `${failures} of ${CHECKS.length} database guards FAILED`,
  )

  await closePool()
  if (failures > 0) process.exit(1)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
