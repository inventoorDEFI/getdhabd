/**
 * Code pack loader: turns a transcribed pack into clause and rule rows.
 *
 * Every rule lands as 'draft' and every clause as 'unverified'. Nothing this
 * loader writes can produce a finding. Making the corpus usable takes a second,
 * human step: somebody opens the source page, compares the text character by
 * character, and records their name against it. That gap is the product.
 */

import { createHash } from 'node:crypto'
import { foldForMatching } from '../arabic/normalise'
import { clauseRefSegments } from './clause-ref'
import { CodePackError, type CodePack } from './pack'
import type { CorpusWriter } from './ports'

export interface LoadOptions {
  /** Who ran the load. Recorded on the document and on every rule. */
  readonly loadedBy: string
  /** Raw bytes of the source document, when available, for hashing. */
  readonly sourceBytes?: Uint8Array | undefined
}

export interface LoadResult {
  readonly documentId: string
  readonly documentCreated: boolean
  readonly sourceSha256: string
  readonly clausesInserted: number
  readonly rulesInserted: number
  /** Always equals rulesInserted. Stated in the result so a caller can assert it. */
  readonly rulesActivated: 0
  readonly warnings: readonly string[]
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

export async function loadCodePack(
  pack: CodePack,
  writer: CorpusWriter,
  options: LoadOptions,
): Promise<LoadResult> {
  const sourceSha256 = resolveSourceHash(pack, options)
  const warnings: string[] = []

  if (pack.document.code_system === 'FIXTURE') {
    warnings.push(
      `document ${pack.document.doc_code} is a FIXTURE. Rules citing it cannot appear in a report unless fixtures are explicitly permitted.`,
    )
  }

  return writer.transaction(async (tx) => {
    const document = await tx.upsertDocument({
      codeSystem: pack.document.code_system,
      docCode: pack.document.doc_code,
      editionYear: pack.document.edition_year,
      titleAr: pack.document.title_ar,
      titleEn: pack.document.title_en ?? null,
      sourceFileName: pack.document.source_file_name,
      sourceSha256,
      sourceUrl: pack.document.source_url ?? null,
      totalPages: pack.document.total_pages ?? null,
      jurisdiction: pack.document.jurisdiction,
      ingestedBy: options.loadedBy,
      reproductionRights: pack.document.reproduction_rights,
      rightsNote: pack.document.rights_note ?? null,
      rightsConfirmedBy: pack.document.rights_confirmed_by ?? null,
    })

    const clauseIds = new Map<string, string>()

    for (const clause of pack.clauses) {
      if (
        pack.document.total_pages != null &&
        clause.page_number > pack.document.total_pages
      ) {
        throw new CodePackError('code pack failed validation', [
          `clause ${clause.clause_number}: page_number ${clause.page_number} exceeds the document's ${pack.document.total_pages} pages`,
        ])
      }

      const inserted = await tx.insertClause({
        documentId: document.id,
        clauseNumber: clause.clause_number,
        clausePath: clauseRefSegments(clause.clause_number),
        partNumber: clause.part_number ?? null,
        chapterNumber: clause.chapter_number ?? null,
        sectionNumber: clause.section_number ?? null,
        headingAr: clause.heading_ar ?? null,
        headingEn: clause.heading_en ?? null,
        // Verbatim, untouched. The normalised copy goes in its own column.
        textAr: clause.text_ar,
        textEn: clause.text_en ?? null,
        textArNormalised: foldForMatching(clause.text_ar),
        pageNumber: clause.page_number,
        bbox: clause.bbox ?? null,
      })

      clauseIds.set(clause.clause_number, inserted.id)
    }

    let rulesInserted = 0

    for (const rule of pack.rules) {
      const clauseId = clauseIds.get(rule.clause_number)
      if (clauseId == null) {
        // parseCodePack already checks this. Repeated here because the loader is
        // also reachable with a hand built pack object in tests and scripts.
        throw new CodePackError('code pack failed validation', [
          `rule ${rule.rule_key}: clause ${rule.clause_number} was not inserted`,
        ])
      }

      await tx.insertRule({
        clauseId,
        ruleKey: rule.rule_key,
        checkType: rule.check_type,
        buildingType: rule.building_type,
        zoneCode: rule.zone_code ?? null,
        jurisdiction: rule.jurisdiction ?? pack.document.jurisdiction,
        parameters: rule.parameters,
        unit: rule.unit ?? null,
        severity: rule.severity,
        appliesWhen: rule.applies_when,
        summaryAr: rule.summary_ar ?? null,
        summaryEn: rule.summary_en ?? null,
        // Not negotiable, and not an option on LoadOptions.
        status: 'draft',
        authoredBy: options.loadedBy,
      })

      rulesInserted++
    }

    if (rulesInserted > 0) {
      warnings.push(
        `${rulesInserted} rule(s) loaded as draft. They will not produce findings until their clauses are verified and the rules activated. Run: npm run codes:verify`,
      )
    }

    return {
      documentId: document.id,
      documentCreated: document.created,
      sourceSha256,
      clausesInserted: pack.clauses.length,
      rulesInserted,
      rulesActivated: 0 as const,
      warnings,
    }
  })
}

/**
 * Establishes the source hash.
 *
 * When both the bytes and a declared hash are present they must agree. That
 * catches the case that matters: a pack transcribed from the 2018 edition being
 * loaded against the 2024 PDF, which would attach real clause text to the wrong
 * provenance and make every citation subtly wrong.
 */
function resolveSourceHash(pack: CodePack, options: LoadOptions): string {
  const declared = pack.document.source_sha256
  const computed = options.sourceBytes ? sha256Hex(options.sourceBytes) : undefined

  if (computed != null && declared != null && computed !== declared) {
    throw new CodePackError('source document does not match the pack', [
      `document.source_sha256 is ${declared} but the file provided hashes to ${computed}.`,
      'Either the pack was transcribed from a different edition, or the wrong file was passed.',
    ])
  }

  const hash = computed ?? declared
  if (hash == null) {
    throw new CodePackError('source document has no provenance', [
      'document: neither source_sha256 nor a readable source_path was provided.',
    ])
  }

  return hash
}
