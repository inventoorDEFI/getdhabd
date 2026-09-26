/**
 * The code pack format: the file a transcriber fills in with a code document
 * open beside them.
 *
 * Validation is strict and unhelpful on purpose. A pack that is nearly right
 * gets rejected with a list of what to fix, rather than loaded with gaps that
 * later show up as a clause with no text or a rule with no page number.
 */

import { z } from 'zod'

/**
 * The token a transcription template uses for a field a human still has to fill.
 * The loader refuses any pack still containing it, and a CHECK constraint in the
 * database refuses it a second time.
 */
export const TRANSCRIBE_PLACEHOLDER = '<<TRANSCRIBE>>'

const noPlaceholder = (field: string) =>
  z
    .string()
    .min(1, `${field} must not be empty`)
    .refine((v) => !v.includes('<<TRANSCRIBE'), {
      message: `${field} still contains ${TRANSCRIBE_PLACEHOLDER}. Transcribe it from the source document before loading.`,
    })

const sha256 = z
  .string()
  .regex(/^[0-9a-f]{64}$/, 'source_sha256 must be 64 lowercase hex characters')

const bboxSchema = z.object({
  x0: z.number(),
  y0: z.number(),
  x1: z.number(),
  y1: z.number(),
})

export const documentSchema = z.object({
  code_system: z.enum(['SBC', 'MOMRA', 'MUNICIPAL', 'FIXTURE']),
  doc_code: noPlaceholder('doc_code'),
  edition_year: z.number().int().min(1970).max(2100),
  title_ar: noPlaceholder('title_ar'),
  title_en: z.string().min(1).nullable().optional(),

  source_file_name: z.string().min(1),
  /**
   * Omit when `source_path` is given: the loader computes it from the file. Give
   * it explicitly and the loader checks the file matches, so a pack transcribed
   * from one edition cannot be loaded against another.
   */
  source_sha256: sha256.optional(),
  /** Path to the actual PDF, relative to the pack file. */
  source_path: z.string().min(1).nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  total_pages: z.number().int().positive().nullable().optional(),
  jurisdiction: z.string().min(1).default('KSA'),

  /**
   * Whether the rights holder permits reproducing this document's text to a
   * user. Defaults to 'unknown', which behaves as 'not_permitted'. Setting
   * 'permitted' requires evidence: who confirmed it and a note describing the
   * permission, because an unevidenced claim of permission is worth nothing.
   */
  reproduction_rights: z.enum(['permitted', 'not_permitted', 'unknown']).default('unknown'),
  rights_note: z.string().min(1).nullable().optional(),
  rights_confirmed_by: z.string().min(1).nullable().optional(),
})

export const clauseSchema = z.object({
  clause_number: noPlaceholder('clause_number'),
  page_number: z.number().int().positive({
    message: 'page_number is required: a clause nobody can find in the source is not citable',
  }),
  part_number: z.string().min(1).nullable().optional(),
  chapter_number: z.string().min(1).nullable().optional(),
  section_number: z.string().min(1).nullable().optional(),
  heading_ar: noPlaceholder('heading_ar').nullable().optional(),
  heading_en: z.string().min(1).nullable().optional(),
  /** Verbatim Arabic text of the clause, copied exactly. */
  text_ar: noPlaceholder('text_ar'),
  text_en: z.string().min(1).nullable().optional(),
  bbox: bboxSchema.nullable().optional(),
  /** Free note for whoever transcribes or verifies this clause. Not loaded. */
  transcriber_note: z.string().nullable().optional(),
})

export const ruleSchema = z.object({
  rule_key: z
    .string()
    .regex(
      /^[a-z][a-z0-9]*(\.[a-z0-9_]+)+$/,
      'rule_key must be dotted lowercase, e.g. setback.front.min',
    ),
  check_type: z.string().min(1),
  /** Clause this rule is derived from. Must exist in this pack or in the document already. */
  clause_number: noPlaceholder('clause_number'),
  building_type: z.string().min(1),
  zone_code: z.string().min(1).nullable().optional(),
  jurisdiction: z.string().min(1).optional(),
  parameters: z.record(z.unknown()),
  unit: z.string().min(1).nullable().optional(),
  severity: z.enum(['blocking', 'major', 'minor', 'advisory']).default('major'),
  applies_when: z.record(z.unknown()).default({}),
  /** Supporting clauses the report should also show. */
  supporting_clauses: z.array(z.string().min(1)).default([]),
  /**
   * Dhabt's own restatement of the requirement, in Arabic. Required whenever the
   * source document does not permit reproduction, because it is what the report
   * shows in place of the clause text. State the numeric limit plainly: a limit
   * is a fact, and facts are not protected expression.
   */
  summary_ar: noPlaceholder('summary_ar').nullable().optional(),
  summary_en: z.string().min(1).nullable().optional(),
  /** Free note for whoever authors or reviews this rule. Not loaded. */
  transcriber_note: z.string().nullable().optional(),
})

export const codePackSchema = z.object({
  /** Pack format version, so an old pack fails loudly rather than partially. */
  pack_version: z.literal(1),
  document: documentSchema,
  clauses: z.array(clauseSchema).min(1),
  rules: z.array(ruleSchema).default([]),
})

export type CodePack = z.infer<typeof codePackSchema>
export type CodePackDocument = z.infer<typeof documentSchema>
export type CodePackClause = z.infer<typeof clauseSchema>
export type CodePackRule = z.infer<typeof ruleSchema>

export class CodePackError extends Error {
  constructor(
    message: string,
    readonly problems: readonly string[],
  ) {
    super(problems.length > 0 ? `${message}\n  - ${problems.join('\n  - ')}` : message)
    this.name = 'CodePackError'
  }
}

/**
 * Validates a parsed YAML or JSON object as a code pack, including the
 * cross-field checks zod cannot express on its own.
 */
export function parseCodePack(raw: unknown): CodePack {
  const result = codePackSchema.safeParse(raw)

  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
    )
    throw new CodePackError('code pack failed validation', problems)
  }

  const pack = result.data
  const problems: string[] = []

  if (pack.document.reproduction_rights === 'permitted') {
    if (pack.document.rights_confirmed_by == null || pack.document.rights_note == null) {
      problems.push(
        'document: reproduction_rights "permitted" requires rights_confirmed_by and rights_note. ' +
          'Record who obtained the permission and what it covers.',
      )
    }
  } else {
    // Without permission the report shows our restatement, so every rule needs one.
    pack.rules.forEach((rule, index) => {
      if (rule.summary_ar == null || rule.summary_ar.trim() === '') {
        problems.push(
          `rules[${index}] (${rule.rule_key}): summary_ar is required because ` +
            `document.reproduction_rights is "${pack.document.reproduction_rights}". ` +
            'The report cannot print the clause text, so it needs our own restatement.',
        )
      }
    })
  }

  if (pack.document.source_sha256 == null && pack.document.source_path == null) {
    problems.push(
      'document: one of source_sha256 or source_path is required. A clause corpus with no provenance is not loadable.',
    )
  }

  // Duplicate clause numbers within a pack mean one of them will silently win.
  const seen = new Map<string, number>()
  pack.clauses.forEach((clause, index) => {
    const prior = seen.get(clause.clause_number)
    if (prior !== undefined) {
      problems.push(
        `clauses[${index}]: clause_number ${clause.clause_number} already appears at clauses[${prior}]`,
      )
    } else {
      seen.set(clause.clause_number, index)
    }
  })

  // Every rule must name a clause that this pack actually carries. A rule
  // pointing at a clause number that is not here would either fail at insert or,
  // worse, bind to a same numbered clause in a different part of the document.
  pack.rules.forEach((rule, index) => {
    if (!seen.has(rule.clause_number)) {
      problems.push(
        `rules[${index}] (${rule.rule_key}): clause_number ${rule.clause_number} is not among the clauses in this pack`,
      )
    }
    for (const supporting of rule.supporting_clauses) {
      if (!seen.has(supporting)) {
        problems.push(
          `rules[${index}] (${rule.rule_key}): supporting clause ${supporting} is not among the clauses in this pack`,
        )
      }
    }
  })

  if (problems.length > 0) throw new CodePackError('code pack failed validation', problems)

  return pack
}
