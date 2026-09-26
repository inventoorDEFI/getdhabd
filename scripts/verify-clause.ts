/**
 * Clause verification: the human step that makes a clause citable.
 *
 * Usage:
 *   npm run codes:verify -- --doc "SBC 201" --clause 1004.3.2 --by "your name" [--activate]
 *   npm run codes:verify -- --doc "SBC 201" --pending          # list what is waiting
 *
 * The command prints the stored clause text and the page it claims to come from,
 * then requires the operator to type the clause number back before it records
 * verification. The friction is the point: verification means somebody opened the
 * page and compared, and their name goes on the record.
 */
import { createInterface } from 'node:readline/promises'
import { closePool, getPool } from '../src/lib/db/client'
import { canonicaliseClauseRef, canonicaliseDocCode } from '../src/lib/rules/clause-ref'

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}
const has = (name: string): boolean => process.argv.includes(`--${name}`)

interface ClauseRow {
  id: string
  clause_number: string
  heading_ar: string | null
  text_ar: string
  page_number: number
  verification_status: string
  doc_code: string
  edition_year: number
  source_file_name: string
  source_sha256: string
}

async function main(): Promise<void> {
  const docArg = flag('doc')
  if (docArg == null) {
    console.error('usage: npm run codes:verify -- --doc "SBC 201" [--clause 1004.3.2] [--by "name"] [--activate]')
    process.exit(2)
  }

  const pool = getPool()

  const { rows } = await pool.query<ClauseRow>(
    `SELECT c.id, c.clause_number, c.heading_ar, c.text_ar, c.page_number,
            c.verification_status, d.doc_code, d.edition_year,
            d.source_file_name, d.source_sha256
       FROM code_clauses c
       JOIN code_documents d ON d.id = c.document_id
      ORDER BY c.clause_path`,
  )

  const inDocument = rows.filter(
    (row) => canonicaliseDocCode(row.doc_code) === canonicaliseDocCode(docArg),
  )

  if (inDocument.length === 0) {
    console.error(`no clauses loaded for document ${docArg}`)
    process.exit(1)
  }

  if (has('pending')) {
    const pending = inDocument.filter((row) => row.verification_status === 'unverified')
    console.log(`${pending.length} of ${inDocument.length} clause(s) awaiting verification in ${docArg}:`)
    for (const row of pending) {
      console.log(`  ${row.clause_number}  page ${row.page_number}  ${row.heading_ar ?? ''}`)
    }
    await closePool()
    return
  }

  const clauseArg = flag('clause')
  if (clauseArg == null) {
    console.error('--clause is required, or pass --pending to list what is waiting')
    process.exit(2)
  }

  const clause = inDocument.find(
    (row) => canonicaliseClauseRef(row.clause_number) === canonicaliseClauseRef(clauseArg),
  )
  if (clause == null) {
    console.error(`clause ${clauseArg} is not loaded for ${docArg}`)
    process.exit(1)
  }

  const verifiedBy = flag('by') ?? process.env.USER
  if (verifiedBy == null || verifiedBy.trim() === '') {
    console.error('--by is required: a verified clause records who verified it')
    process.exit(2)
  }

  console.log('')
  console.log(`document   ${clause.doc_code} ${clause.edition_year}`)
  console.log(`file       ${clause.source_file_name}`)
  console.log(`sha256     ${clause.source_sha256}`)
  console.log(`clause     ${clause.clause_number}`)
  console.log(`page       ${clause.page_number}`)
  console.log(`heading    ${clause.heading_ar ?? '(none)'}`)
  console.log(`status     ${clause.verification_status}`)
  console.log('')
  console.log('stored text, exactly as it will appear in every report:')
  console.log('')
  console.log(clause.text_ar)
  console.log('')
  console.log(`Open ${clause.source_file_name} at page ${clause.page_number} and compare the text above, character by character.`)
  console.log('')

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(
    `If it matches exactly, type the clause number to confirm (${clause.clause_number}), or anything else to abort: `,
  )
  rl.close()

  if (canonicaliseClauseRef(answer) !== canonicaliseClauseRef(clause.clause_number)) {
    console.log('aborted, nothing changed')
    await closePool()
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `UPDATE code_clauses
          SET verification_status = 'verified', verified_by = $2, verified_at = now()
        WHERE id = $1`,
      [clause.id, verifiedBy],
    )

    let activated = 0
    if (has('activate')) {
      const { rowCount } = await client.query(
        `UPDATE rules SET status = 'active' WHERE clause_id = $1 AND status = 'draft'`,
        [clause.id],
      )
      activated = rowCount ?? 0
    }

    await client.query('COMMIT')
    console.log(`\nclause ${clause.clause_number} verified by ${verifiedBy}`)
    if (has('activate')) {
      console.log(`${activated} rule(s) activated and now able to produce findings`)
    } else {
      console.log('rules citing it are still draft. Re-run with --activate when the parameters are right.')
    }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }

  await closePool()
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
