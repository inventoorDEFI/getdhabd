/**
 * Loads a code pack into the corpus.
 *
 * Usage:
 *   npm run codes:load -- <pack.yaml> [--source <document.pdf>] [--by "name"]
 *
 * Everything loaded is inert. Clauses land unverified and rules land draft, so
 * nothing this command writes can appear in a report. Run npm run codes:verify
 * next, with the source document open.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { closePool, getPool } from '../src/lib/db/client'
import { loadCodePack } from '../src/lib/rules/loader'
import { parseCodePack } from '../src/lib/rules/pack'
import { PostgresCorpus } from '../src/lib/rules/postgres-corpus'

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}

async function main(): Promise<void> {
  const packPath = process.argv[2]
  if (packPath == null || packPath.startsWith('--')) {
    console.error('usage: npm run codes:load -- <pack.yaml> [--source <document.pdf>] [--by "name"]')
    process.exit(2)
  }

  const loadedBy = flag('by') ?? process.env.USER ?? 'unknown'
  const packAbs = resolve(process.cwd(), packPath)
  const pack = parseCodePack(parseYaml(readFileSync(packAbs, 'utf8')))

  // --source wins; otherwise fall back to source_path from the pack, resolved
  // relative to the pack file so a pack is portable.
  const sourceArg = flag('source') ?? pack.document.source_path ?? undefined
  const sourceBytes =
    sourceArg == null
      ? undefined
      : new Uint8Array(readFileSync(resolve(dirname(packAbs), sourceArg)))

  if (sourceBytes == null && pack.document.source_sha256 == null) {
    console.error(
      'no source document available to hash, and the pack declares no source_sha256.\n' +
        'Pass --source <document.pdf>.',
    )
    process.exit(2)
  }

  const corpus = new PostgresCorpus(getPool())
  const result = await loadCodePack(pack, corpus, { loadedBy, sourceBytes })

  console.log(`document  ${pack.document.doc_code} ${pack.document.edition_year} (${result.documentCreated ? 'created' : 'existing'})`)
  console.log(`sha256    ${result.sourceSha256}`)
  console.log(`clauses   ${result.clausesInserted} inserted, all unverified`)
  console.log(`rules     ${result.rulesInserted} inserted, all draft, ${result.rulesActivated} active`)
  for (const warning of result.warnings) console.log(`\nnote: ${warning}`)

  await closePool()
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
