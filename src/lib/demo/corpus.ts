/**
 * The demo submission, built by running the real pipeline.
 *
 * Nothing on the report page is hand written markup. This module loads the
 * fixture code pack through the actual loader, verifies and activates it through
 * the actual corpus guards, then pushes a set of candidate findings through the
 * actual grounding gate. What the page renders is whatever came out.
 *
 * That matters for a demo of this product specifically: a mocked up report would
 * show the citations looking correct without any of the machinery that makes them
 * correct, which is the exact impression this product must not give.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { loadCodePack } from '@/lib/rules/loader'
import { MemoryCorpus } from '@/lib/rules/memory-corpus'
import { parseCodePack } from '@/lib/rules/pack'
import { groundCandidates, type CandidateFinding, type GroundingResult } from '@/lib/rules/grounding'
import type { GroundableRule, RuleScope } from '@/lib/rules/types'

export interface DemoSubmission {
  readonly projectAr: string
  readonly plotNumber: string
  readonly planNumber: string
  readonly zoneAr: string
  readonly municipalityAr: string
  readonly plotWidthM: number
  readonly plotDepthM: number
  readonly submittedOn: string
  readonly sheets: ReadonlyArray<{ id: string; labelAr: string; labelEn: string }>
}

export const DEMO_SUBMISSION: DemoSubmission = {
  projectAr: 'فيلا سكنية، حي الملقا',
  plotNumber: '4127',
  planNumber: '2309',
  zoneAr: 'سكني أ',
  municipalityAr: 'أمانة منطقة الرياض',
  plotWidthM: 20,
  plotDepthM: 30,
  submittedOn: '2026-09-26',
  sheets: [
    { id: 'A-101', labelAr: 'مخطط الموقع', labelEn: 'Site plan' },
    { id: 'A-102', labelAr: 'مسقط الدور الأرضي', labelEn: 'Ground floor plan' },
    { id: 'A-203', labelAr: 'المقطع أ-أ', labelEn: 'Section A-A' },
  ],
}

const SCOPE: RuleScope = {
  buildingType: 'residential_villa',
  jurisdiction: 'KSA',
  // The fixture document is a FIXTURE, so the gate would suppress everything
  // without this. Set only here, in the demo path, never from a request.
  allowFixtures: true,
}

/**
 * Candidates as extraction and matching would emit them.
 *
 * Hand written, because steps 3 and 4 do not exist yet. This is the one mocked
 * boundary in the demo and it is mocked on the input side, upstream of the gate,
 * so everything the gate does to them is real.
 */
const CANDIDATES: readonly CandidateFinding[] = [
  {
    ruleKey: 'setback.front.min',
    outcome: 'fail',
    observedValue: 2.4,
    observedUnit: 'm',
    noteAr: 'أقرب نقطة في المبنى إلى حد الملكية الأمامي',
    location: { sheetId: 'A-101', sheetLabel: 'مخطط الموقع', pdfPage: 1, x: 240, y: 512 },
    confidence: 0.94,
  },
  {
    ruleKey: 'stair.width.min',
    outcome: 'fail',
    observedValue: 850,
    observedUnit: 'mm',
    noteAr: 'العرض الصافي بين الدرابزينات في الدرج الرئيسي',
    location: { sheetId: 'A-203', sheetLabel: 'المقطع أ-أ', pdfPage: 3, x: 418, y: 296 },
    confidence: 0.88,
  },
  {
    ruleKey: 'coverage.ratio.max',
    outcome: 'pass',
    observedValue: 0.57,
    observedUnit: 'ratio',
    noteAr: 'مساحة مسقط الدور الأرضي مقسومة على مساحة الأرض',
    location: { sheetId: 'A-101', sheetLabel: 'مخطط الموقع', pdfPage: 1, x: 180, y: 640 },
    confidence: 0.91,
  },
  {
    ruleKey: 'setback.rear.min',
    outcome: 'pass',
    observedValue: 3.1,
    observedUnit: 'm',
    location: { sheetId: 'A-101', sheetLabel: 'مخطط الموقع', pdfPage: 1, x: 240, y: 120 },
    confidence: 0.93,
  },
  {
    ruleKey: 'height.max',
    outcome: 'pass',
    observedValue: 11.2,
    observedUnit: 'm',
    location: { sheetId: 'A-203', sheetLabel: 'المقطع أ-أ', pdfPage: 3, x: 500, y: 400 },
    confidence: 0.9,
  },
  {
    ruleKey: 'door.clear_width.min',
    outcome: 'pass',
    observedValue: 820,
    observedUnit: 'mm',
    location: { sheetId: 'A-102', sheetLabel: 'مسقط الدور الأرضي', pdfPage: 2, x: 305, y: 244 },
    confidence: 0.79,
  },

  // --- the two that must not reach the report ------------------------------

  {
    // A rule that exists, with a clause number the model invented. The measured
    // figure may even be right, but the citation is not, so the gate drops it.
    ruleKey: 'parking.count.min',
    clauseNumber: 'F.9.9',
    outcome: 'fail',
    observedValue: 1,
    observedUnit: 'space',
    quotedClauseText: 'يخصص ثلاثة مواقف لكل وحدة سكنية',
    location: { sheetId: 'A-101', sheetLabel: 'مخطط الموقع', pdfPage: 1, x: 96, y: 300 },
    confidence: 0.71,
  },
  {
    // A rule that does not exist at all. The model has decided there is a clause
    // about balcony projection and written one.
    ruleKey: 'balcony.projection.max',
    docCode: 'SBC 201',
    clauseNumber: '7.4.2',
    outcome: 'fail',
    observedValue: 1.4,
    observedUnit: 'm',
    quotedClauseText: 'لا يزيد بروز الشرفة عن متر واحد خارج حد البناء',
    location: { sheetId: 'A-102', sheetLabel: 'مسقط الدور الأرضي', pdfPage: 2, x: 410, y: 180 },
    confidence: 0.66,
  },
]

export interface DemoReport extends GroundingResult {
  readonly submission: DemoSubmission
  readonly groundableRules: readonly GroundableRule[]
  readonly documentTitleAr: string
  readonly docCode: string
  readonly sourceSha256: string
  readonly clauseCount: number
  readonly ruleCount: number
}

let cached: Promise<DemoReport> | undefined

/** Built once per server process. */
export function getDemoReport(): Promise<DemoReport> {
  cached ??= build()
  return cached
}

async function build(): Promise<DemoReport> {
  const corpus = new MemoryCorpus()

  const packPath = resolve(process.cwd(), 'data/codes/fixture-villa-demo.yaml')
  const pack = parseCodePack(parseYaml(readFileSync(packPath, 'utf8')))
  await loadCodePack(pack, corpus, { loadedBy: 'demo' })

  // The human step, simulated. In production a person opens the source page and
  // compares before this happens, and the guards refuse activation until they do.
  for (const clause of [...corpus.clauses.values()]) {
    await corpus.setClauseVerification({
      clauseId: clause.id,
      status: 'verified',
      verifiedBy: 'demo',
      note: 'fixture document, verified automatically for the demo only',
    })
  }
  for (const rule of [...corpus.rules.values()]) {
    await corpus.setRuleStatus(rule.id, 'active')
  }

  const groundableRules = await corpus.listGroundableRules(SCOPE)
  const result = groundCandidates(CANDIDATES, groundableRules, SCOPE)

  await corpus.logGroundingRejections(result.rejections, {
    submissionId: 'demo',
    modelName: 'demo-fixture',
  })

  const document = [...corpus.documents.values()][0]!

  return {
    ...result,
    submission: DEMO_SUBMISSION,
    groundableRules,
    documentTitleAr: document.titleAr,
    docCode: document.docCode,
    sourceSha256: document.sourceSha256,
    clauseCount: corpus.clauses.size,
    ruleCount: corpus.rules.size,
  }
}
