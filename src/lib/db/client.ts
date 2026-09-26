import { Pool, type PoolClient } from 'pg'

let pool: Pool | undefined

export function getPool(): Pool {
  if (pool) return pool

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.')
  }

  pool = new Pool({ connectionString, max: 10 })
  return pool
}

export async function closePool(): Promise<void> {
  await pool?.end()
  pool = undefined
}

export type { PoolClient }

/**
 * Whether fixture code documents may produce findings.
 *
 * Read from the environment rather than passed in, so no request parameter and
 * no function argument can turn fixture clauses into report content.
 */
export function fixturesAllowed(): boolean {
  return process.env.DHABT_ALLOW_FIXTURE_CODES === '1'
}
