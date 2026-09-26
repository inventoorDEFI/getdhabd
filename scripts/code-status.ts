/**
 * What the system will actually check, and what it will not.
 *
 * Usage: npm run codes:status
 *
 * The point of this command is that "not checked" should never be a surprise. It
 * shows, per rule key, whether the corpus can currently produce a finding, and if
 * not, which half is missing.
 */
import { closePool, getPool } from '../src/lib/db/client'
import { CHECK_TYPES } from '../src/lib/rules/types'

interface StatusRow {
  rule_key: string
  check_type: string
  building_type: string
  jurisdiction: string
  zone_code: string | null
  rule_status: string
  clause_number: string
  verification_status: string
  doc_code: string
  is_fixture: boolean
}

async function main(): Promise<void> {
  const pool = getPool()

  const { rows: documents } = await pool.query<{
    doc_code: string
    edition_year: number
    is_fixture: boolean
    clauses: string
    verified: string
  }>(
    `SELECT d.doc_code, d.edition_year, d.is_fixture,
            count(c.id)                                              AS clauses,
            count(c.id) FILTER (WHERE c.verification_status = 'verified') AS verified
       FROM code_documents d
       LEFT JOIN code_clauses c ON c.document_id = d.id
      GROUP BY d.id, d.doc_code, d.edition_year, d.is_fixture
      ORDER BY d.doc_code`,
  )

  console.log('documents')
  if (documents.length === 0) console.log('  (none loaded)')
  for (const doc of documents) {
    const fixture = doc.is_fixture ? '  [FIXTURE, cannot appear in a report]' : ''
    console.log(
      `  ${doc.doc_code} ${doc.edition_year}  ${doc.verified}/${doc.clauses} clause(s) verified${fixture}`,
    )
  }

  const { rows } = await pool.query<StatusRow>(
    `SELECT r.rule_key, r.check_type, r.building_type, r.jurisdiction, r.zone_code,
            r.status AS rule_status, c.clause_number, c.verification_status,
            d.doc_code, d.is_fixture
       FROM rules r
       JOIN code_clauses   c ON c.id = r.clause_id
       JOIN code_documents d ON d.id = c.document_id
      ORDER BY r.rule_key`,
  )

  console.log('\nchecks')
  const byKey = new Map<string, StatusRow[]>()
  for (const row of rows) {
    const bucket = byKey.get(row.rule_key)
    if (bucket) bucket.push(row)
    else byKey.set(row.rule_key, [row])
  }

  for (const [key, entries] of [...byKey].sort()) {
    for (const entry of entries) {
      const groundable =
        entry.rule_status === 'active' &&
        entry.verification_status === 'verified' &&
        !entry.is_fixture

      const blocker = groundable
        ? 'checked'
        : entry.is_fixture
          ? 'not checked: cites a fixture document'
          : entry.verification_status !== 'verified'
            ? `not checked: clause ${entry.clause_number} is ${entry.verification_status}`
            : `not checked: rule is ${entry.rule_status}`

      const zone = entry.zone_code == null ? '' : ` zone ${entry.zone_code}`
      console.log(`  ${key.padEnd(30)} ${entry.doc_code} ${entry.clause_number}${zone}  ${blocker}`)
    }
  }

  const covered = new Set(rows.map((r) => r.check_type))
  const missing = CHECK_TYPES.filter((type) => !covered.has(type))
  if (missing.length > 0) {
    console.log('\ncheck types with no rule loaded at all')
    for (const type of missing) console.log(`  ${type}`)
  }

  const { rows: rejections } = await pool.query<{ reason: string; n: string }>(
    `SELECT reason, count(*) AS n
       FROM grounding_rejections
      WHERE created_at > now() - interval '30 days'
      GROUP BY reason
      ORDER BY count(*) DESC`,
  )

  console.log('\nsuppressed findings, last 30 days')
  if (rejections.length === 0) console.log('  (none)')
  for (const row of rejections) console.log(`  ${row.n.padStart(6)}  ${row.reason}`)

  await closePool()
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
