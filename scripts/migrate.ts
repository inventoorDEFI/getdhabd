/**
 * Applies db/migrations/*.sql in filename order, once each.
 *
 * Usage: npm run db:migrate
 */
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { closePool, getPool } from '../src/lib/db/client'

const MIGRATIONS_DIR = resolve(import.meta.dirname, '../db/migrations')

async function main(): Promise<void> {
  const pool = getPool()

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `)

  const { rows } = await pool.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations',
  )
  const applied = new Set(rows.map((r) => r.filename))

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  let count = 0
  for (const filename of files) {
    if (applied.has(filename)) continue

    const sql = readFileSync(resolve(MIGRATIONS_DIR, filename), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename])
      await client.query('COMMIT')
      console.log(`applied ${filename}`)
      count++
    } catch (error) {
      await client.query('ROLLBACK')
      console.error(`failed ${filename}`)
      throw error
    } finally {
      client.release()
    }
  }

  console.log(count === 0 ? 'nothing to apply' : `${count} migration(s) applied`)
  await closePool()
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
