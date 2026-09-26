import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { CodePackError, parseCodePack, type CodePack } from '@/lib/rules/pack.js'
import { loadCodePack, sha256Hex } from '@/lib/rules/loader.js'
import { MemoryCorpus } from '@/lib/rules/memory-corpus.js'

const FIXTURE_PATH = resolve(import.meta.dirname, '../data/codes/fixture-villa-demo.yaml')
const TEMPLATE_PATHS = [
  resolve(import.meta.dirname, '../data/codes/TEMPLATE-envelope-municipal.yaml'),
  resolve(import.meta.dirname, '../data/codes/TEMPLATE-life-safety-sbc.yaml'),
]

function readFixturePack(): CodePack {
  return parseCodePack(parseYaml(readFileSync(FIXTURE_PATH, 'utf8')))
}

function minimalPack(overrides: Record<string, unknown> = {}): unknown {
  return {
    pack_version: 1,
    document: {
      code_system: 'MUNICIPAL',
      doc_code: 'DEMO-01',
      edition_year: 2025,
      title_ar: 'اشتراطات البناء',
      source_file_name: 'demo.pdf',
      source_sha256: 'a'.repeat(64),
      jurisdiction: 'KSA',
    },
    clauses: [
      {
        clause_number: '1.1',
        page_number: 3,
        heading_ar: 'الارتداد الأمامي',
        text_ar: 'لا يقل الارتداد الأمامي عن ثلاثة أمتار.',
      },
    ],
    rules: [],
    ...overrides,
  }
}

// --- validation -------------------------------------------------------------

describe('pack validation', () => {
  it('rejects a pack that still contains a transcription placeholder', () => {
    const pack = minimalPack() as Record<string, unknown>
    ;(pack.clauses as Record<string, unknown>[])[0]!.text_ar = '<<TRANSCRIBE>>'

    expect(() => parseCodePack(pack)).toThrow(CodePackError)
    expect(() => parseCodePack(pack)).toThrow(/TRANSCRIBE/)
  })

  it('rejects both shipped templates until a human fills them in', () => {
    // The templates exist to be filled in with the source document open. Loading
    // one as shipped would create a corpus of empty citations.
    for (const path of TEMPLATE_PATHS) {
      const raw = parseYaml(readFileSync(path, 'utf8'))
      expect(() => parseCodePack(raw), path).toThrow(CodePackError)
    }
  })

  it('rejects a clause with no page number', () => {
    const pack = minimalPack() as Record<string, unknown>
    delete (pack.clauses as Record<string, unknown>[])[0]!.page_number
    expect(() => parseCodePack(pack)).toThrow(/page_number/)
  })

  it('rejects a clause with empty text', () => {
    const pack = minimalPack() as Record<string, unknown>
    ;(pack.clauses as Record<string, unknown>[])[0]!.text_ar = ''
    expect(() => parseCodePack(pack)).toThrow(CodePackError)
  })

  it('rejects a pack with no provenance at all', () => {
    const pack = minimalPack() as Record<string, unknown>
    delete (pack.document as Record<string, unknown>).source_sha256
    expect(() => parseCodePack(pack)).toThrow(/source_sha256 or source_path/)
  })

  it('rejects a malformed hash', () => {
    const pack = minimalPack() as Record<string, unknown>
    ;(pack.document as Record<string, unknown>).source_sha256 = 'not-a-hash'
    expect(() => parseCodePack(pack)).toThrow(/64 lowercase hex/)
  })

  it('rejects duplicate clause numbers within a pack', () => {
    const pack = minimalPack() as Record<string, unknown>
    const clauses = pack.clauses as Record<string, unknown>[]
    pack.clauses = [clauses[0]!, { ...clauses[0]! }]
    expect(() => parseCodePack(pack)).toThrow(/already appears/)
  })

  it('rejects a rule citing a clause the pack does not carry', () => {
    const pack = minimalPack({
      rules: [
        {
          rule_key: 'setback.front.min',
          check_type: 'setback.min',
          clause_number: '9.9.9',
          building_type: 'residential_villa',
          parameters: { min_m: 3 },
        },
      ],
    })
    expect(() => parseCodePack(pack)).toThrow(/is not among the clauses in this pack/)
  })

  it('rejects a rule citing a supporting clause the pack does not carry', () => {
    const pack = minimalPack({
      rules: [
        {
          rule_key: 'setback.front.min',
          check_type: 'setback.min',
          clause_number: '1.1',
          building_type: 'residential_villa',
          parameters: { min_m: 3 },
          supporting_clauses: ['4.4.4'],
        },
      ],
    })
    expect(() => parseCodePack(pack)).toThrow(/supporting clause 4.4.4/)
  })

  it('rejects a rule key that is not dotted lowercase', () => {
    const pack = minimalPack({
      rules: [
        {
          rule_key: 'Setback Front Min',
          check_type: 'setback.min',
          clause_number: '1.1',
          building_type: 'residential_villa',
          parameters: {},
        },
      ],
    })
    expect(() => parseCodePack(pack)).toThrow(/dotted lowercase/)
  })

  it('rejects an unknown pack version', () => {
    expect(() => parseCodePack(minimalPack({ pack_version: 2 }))).toThrow(CodePackError)
  })

  it('accepts the fixture pack', () => {
    expect(() => readFixturePack()).not.toThrow()
  })
})

// --- provenance -------------------------------------------------------------

describe('provenance', () => {
  it('rejects a load when the source file does not match the declared hash', async () => {
    // The case this catches: a pack transcribed from the 2018 edition being
    // loaded against the 2024 PDF. Every citation would then point at real text
    // with the wrong provenance.
    const pack = parseCodePack(minimalPack())
    const wrongFile = new TextEncoder().encode('a different document entirely')

    await expect(
      loadCodePack(pack, new MemoryCorpus(), { loadedBy: 'tester', sourceBytes: wrongFile }),
    ).rejects.toThrow(/does not match the pack/)
  })

  it('accepts a load when the file matches the declared hash', async () => {
    const bytes = new TextEncoder().encode('the real document')
    const pack = parseCodePack(
      minimalPack({
        document: {
          code_system: 'MUNICIPAL',
          doc_code: 'DEMO-01',
          edition_year: 2025,
          title_ar: 'اشتراطات البناء',
          source_file_name: 'demo.pdf',
          source_sha256: sha256Hex(bytes),
          jurisdiction: 'KSA',
        },
      }),
    )

    const result = await loadCodePack(pack, new MemoryCorpus(), {
      loadedBy: 'tester',
      sourceBytes: bytes,
    })
    expect(result.sourceSha256).toBe(sha256Hex(bytes))
  })

  it('computes the hash from the file when the pack declares none', async () => {
    const bytes = new TextEncoder().encode('the real document')
    const raw = minimalPack() as Record<string, unknown>
    delete (raw.document as Record<string, unknown>).source_sha256
    ;(raw.document as Record<string, unknown>).source_path = 'demo.pdf'

    const result = await loadCodePack(parseCodePack(raw), new MemoryCorpus(), {
      loadedBy: 'tester',
      sourceBytes: bytes,
    })
    expect(result.sourceSha256).toBe(sha256Hex(bytes))
  })
})

// --- loading ----------------------------------------------------------------

describe('loading the fixture pack', () => {
  it('inserts every clause and every rule', async () => {
    const corpus = new MemoryCorpus()
    const result = await loadCodePack(readFixturePack(), corpus, { loadedBy: 'tester' })

    expect(result.clausesInserted).toBe(12)
    expect(result.rulesInserted).toBe(14)
    expect(corpus.clauses.size).toBe(12)
    expect(corpus.rules.size).toBe(14)
  })

  it('covers all eight v1 check families', async () => {
    const corpus = new MemoryCorpus()
    await loadCodePack(readFixturePack(), corpus, { loadedBy: 'tester' })

    const keys = [...corpus.rules.values()].map((r) => r.ruleKey).sort()
    expect(keys).toEqual([
      'coverage.ratio.max',
      'corridor.width.min',
      'door.clear_width.min',
      'egress.exit_count.min',
      'egress.travel_distance.max',
      'floors.max',
      'height.max',
      'parking.count.min',
      'setback.front.min',
      'setback.rear.min',
      'setback.side.min',
      'stair.going.min',
      'stair.riser.max',
      'stair.width.min',
    ].sort())
  })

  it('lands every rule as draft and reports zero activated', async () => {
    const corpus = new MemoryCorpus()
    const result = await loadCodePack(readFixturePack(), corpus, { loadedBy: 'tester' })

    expect(result.rulesActivated).toBe(0)
    for (const rule of corpus.rules.values()) {
      expect(rule.status).toBe('draft')
    }
  })

  it('lands every clause as unverified', async () => {
    const corpus = new MemoryCorpus()
    await loadCodePack(readFixturePack(), corpus, { loadedBy: 'tester' })

    for (const clause of corpus.clauses.values()) {
      expect(clause.verificationStatus).toBe('unverified')
      expect(clause.verifiedBy).toBeNull()
    }
  })

  it('stores clause text verbatim and the fold separately', async () => {
    const corpus = new MemoryCorpus()
    const pack = readFixturePack()
    await loadCodePack(pack, corpus, { loadedBy: 'tester' })

    const sideSetback = [...corpus.clauses.values()].find((c) => c.clauseNumber === 'F.1.3')!
    const source = pack.clauses.find((c) => c.clause_number === 'F.1.3')!

    expect(sideSetback.textAr).toBe(source.text_ar)
    // The Arabic-Indic digits survive in the verbatim text and are folded in the
    // match key. Printing the fold in a report would misquote the code.
    expect(sideSetback.textAr).toContain('١٢٫٥٠')
    expect(sideSetback.textArNormalised).toContain('12.50')
    expect(sideSetback.textArNormalised).not.toContain('١٢٫٥٠')
  })

  it('computes the clause path from the clause number', async () => {
    const corpus = new MemoryCorpus()
    await loadCodePack(readFixturePack(), corpus, { loadedBy: 'tester' })

    const clause = [...corpus.clauses.values()].find((c) => c.clauseNumber === 'F.7.2')!
    expect(clause.clausePath).toEqual(['f', '7', '2'])
  })

  it('keeps the bounding box when the pack supplies one', async () => {
    const corpus = new MemoryCorpus()
    await loadCodePack(readFixturePack(), corpus, { loadedBy: 'tester' })

    const clause = [...corpus.clauses.values()].find((c) => c.clauseNumber === 'F.1.1')!
    expect(clause.bbox).toEqual({ x0: 72, y0: 520, x1: 523, y1: 560 })
  })

  it('warns that the document is a fixture', async () => {
    const result = await loadCodePack(readFixturePack(), new MemoryCorpus(), {
      loadedBy: 'tester',
    })
    expect(result.warnings.join(' ')).toMatch(/FIXTURE/)
  })

  it('warns that the loaded rules are inert until verified', async () => {
    const result = await loadCodePack(readFixturePack(), new MemoryCorpus(), {
      loadedBy: 'tester',
    })
    expect(result.warnings.join(' ')).toMatch(/will not produce findings/)
  })

  it('is idempotent on the document, so reloading does not duplicate it', async () => {
    const corpus = new MemoryCorpus()
    const first = await loadCodePack(readFixturePack(), corpus, { loadedBy: 'tester' })
    expect(first.documentCreated).toBe(true)

    // A second load hits the duplicate clause guard rather than silently
    // creating a parallel corpus.
    await expect(
      loadCodePack(readFixturePack(), corpus, { loadedBy: 'tester' }),
    ).rejects.toThrow(/already exists in document/)
    expect(corpus.documents.size).toBe(1)
  })
})

// --- atomicity --------------------------------------------------------------

describe('atomicity', () => {
  it('leaves nothing behind when a clause fails partway through', async () => {
    const corpus = new MemoryCorpus()
    const pack = readFixturePack()

    // Break the last clause: a page beyond the document's length.
    const broken: CodePack = {
      ...pack,
      clauses: pack.clauses.map((clause, index) =>
        index === pack.clauses.length - 1 ? { ...clause, page_number: 9999 } : clause,
      ),
    }

    await expect(
      loadCodePack(broken, corpus, { loadedBy: 'tester' }),
    ).rejects.toThrow(/exceeds the document/)

    expect(corpus.clauses.size).toBe(0)
    expect(corpus.rules.size).toBe(0)
    expect(corpus.documents.size).toBe(0)
  })
})
