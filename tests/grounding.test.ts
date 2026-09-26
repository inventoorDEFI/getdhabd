import { describe, expect, it } from 'vitest'
import { citationBody, groundCandidates, type CandidateFinding } from '@/lib/rules/grounding.js'
import type { GroundableRule, RuleScope } from '@/lib/rules/types.js'

/**
 * These tests are the product's warranty. Every one of them describes a way a
 * model can produce a confident wrong answer, and asserts that the answer does
 * not reach a report.
 */

const SCOPE: RuleScope = { buildingType: 'residential_villa', jurisdiction: 'KSA' }

const VERBATIM_FRONT_SETBACK =
  'لا يقل الارتداد الأمامي للفيلا السكنية عن ٣٫٠٠ أمتار من حد الملكية المطل على الشارع.'

function rule(overrides: Partial<GroundableRule> = {}): GroundableRule {
  return {
    ruleId: 'rule-front-setback',
    ruleKey: 'setback.front.min',
    checkType: 'setback.min',
    buildingType: 'residential_villa',
    zoneCode: null,
    jurisdiction: 'KSA',
    parameters: { direction: 'front', min_m: 3 },
    unit: 'm',
    severity: 'blocking',
    appliesWhen: {},
    summaryAr: 'الارتداد الأمامي لا يقل عن ٣٫٠٠ أمتار',
    summaryEn: null,

    clauseId: 'clause-f11',
    clauseNumber: 'F.1.1',
    clauseHeadingAr: 'الارتداد الأمامي',
    clauseHeadingEn: null,
    clauseTextAr: VERBATIM_FRONT_SETBACK,
    clauseTextEn: null,
    reproductionRights: 'permitted',
    clausePageNumber: 3,
    clauseBbox: null,

    documentId: 'doc-1',
    codeSystem: 'MUNICIPAL',
    docCode: 'DEMO-01',
    editionYear: 2025,
    documentTitleAr: 'اشتراطات البناء',
    sourceUrl: 'https://example.gov.sa/doc.pdf',
    sourceSha256: 'a'.repeat(64),
    isFixture: false,
    ...overrides,
  }
}

function candidate(overrides: Partial<CandidateFinding> = {}): CandidateFinding {
  return {
    ruleKey: 'setback.front.min',
    outcome: 'fail',
    observedValue: 2.4,
    observedUnit: 'm',
    location: { sheetId: 'A-101', sheetLabel: 'مخطط الموقع', pdfPage: 1, x: 240, y: 512 },
    ...overrides,
  }
}

// --- the happy path, stated so the rejections mean something -----------------

describe('a candidate that resolves', () => {
  it('produces a finding whose citation comes from the loaded clause', () => {
    const rules = [rule()]
    const result = groundCandidates([candidate()], rules, SCOPE)

    expect(result.findings).toHaveLength(1)
    expect(result.rejections).toHaveLength(0)

    const finding = result.findings[0]!
    expect(finding.citation.clauseNumber).toBe('F.1.1')
    expect(finding.citation.clauseTextAr).toBe(VERBATIM_FRONT_SETBACK)
    expect(finding.citation.sourcePage).toBe(3)
    expect(finding.citation.clauseId).toBe('clause-f11')
    expect(finding.observedValue).toBe(2.4)
  })

  it('does not report the rule as not checked', () => {
    const result = groundCandidates([candidate()], [rule()], SCOPE)
    expect(result.notChecked).toHaveLength(0)
  })
})

// --- invented clauses -------------------------------------------------------

describe('a clause the system does not have', () => {
  it('drops a finding whose rule key is not loaded', () => {
    // The model has decided there is a rule about balcony projection. There is
    // no such rule in the corpus, so there is no clause to cite.
    const result = groundCandidates(
      [candidate({ ruleKey: 'balcony.projection.max', clauseNumber: '7.4.2' })],
      [rule()],
      SCOPE,
    )

    expect(result.findings).toHaveLength(0)
    expect(result.rejections).toHaveLength(1)
    expect(result.rejections[0]!.reason).toBe('unknown_rule')
  })

  it('logs what was attempted, so fabrication is visible', () => {
    const result = groundCandidates(
      [
        candidate({
          ruleKey: 'balcony.projection.max',
          docCode: 'SBC 201',
          clauseNumber: '7.4.2',
          quotedClauseText: 'لا يزيد بروز الشرفة عن متر واحد',
        }),
      ],
      [rule()],
      SCOPE,
    )

    const rejection = result.rejections[0]!
    expect(rejection.attemptedRuleKey).toBe('balcony.projection.max')
    expect(rejection.attemptedDocCode).toBe('SBC 201')
    expect(rejection.attemptedClauseRef).toBe('7.4.2')
    expect(rejection.attemptedText).toBe('لا يزيد بروز الشرفة عن متر واحد')
    expect(rejection.detail).toContain('balcony.projection.max')
  })

  it('drops a finding whose rule id is not loaded', () => {
    const result = groundCandidates(
      [candidate({ ruleKey: undefined, ruleId: 'rule-that-does-not-exist' })],
      [rule()],
      SCOPE,
    )
    expect(result.findings).toHaveLength(0)
    expect(result.rejections[0]!.reason).toBe('unknown_rule')
  })

  it('drops a candidate that names no rule at all', () => {
    const result = groundCandidates(
      [candidate({ ruleKey: undefined, ruleId: undefined })],
      [rule()],
      SCOPE,
    )
    expect(result.findings).toHaveLength(0)
    expect(result.rejections[0]!.reason).toBe('missing_rule_reference')
  })
})

// --- real rule, wrong clause ------------------------------------------------

describe('a real rule paired with the wrong clause number', () => {
  it('drops the finding rather than silently correcting the citation', () => {
    // This is the most dangerous case. The rule exists, the measurement may be
    // right, but the model has attached a clause number of its own invention. A
    // system that quietly swapped in the correct clause would be training the
    // engineer to trust a number the model made up.
    const result = groundCandidates(
      [candidate({ clauseNumber: '9.9.9' })],
      [rule()],
      SCOPE,
    )

    expect(result.findings).toHaveLength(0)
    expect(result.rejections[0]!.reason).toBe('clause_reference_mismatch')
    expect(result.rejections[0]!.detail).toContain('F.1.1')
    expect(result.rejections[0]!.detail).toContain('9.9.9')
  })

  it('reports the rule as not checked rather than omitting it', () => {
    const result = groundCandidates(
      [candidate({ clauseNumber: '9.9.9' })],
      [rule()],
      SCOPE,
    )

    expect(result.notChecked).toHaveLength(1)
    expect(result.notChecked[0]!.reason).toBe('suppressed_by_grounding')
    expect(result.notChecked[0]!.rule.ruleKey).toBe('setback.front.min')
  })

  it('accepts the same clause written in a different but equivalent form', () => {
    // Rejecting a correct citation because it was spelled with dashes would push
    // engineers to distrust suppression, which is its own failure.
    for (const variant of ['F-1-1', 'f.1.1', 'المادة F.1.1', '‫F.1.1‬']) {
      const result = groundCandidates(
        [candidate({ clauseNumber: variant })],
        [rule()],
        SCOPE,
      )
      expect(result.findings, `variant ${variant}`).toHaveLength(1)
    }
  })

  it('drops a finding that names the wrong document', () => {
    const result = groundCandidates(
      [candidate({ docCode: 'SBC 801' })],
      [rule()],
      SCOPE,
    )
    expect(result.findings).toHaveLength(0)
    expect(result.rejections[0]!.reason).toBe('document_reference_mismatch')
  })

  it('accepts the right document written differently', () => {
    const result = groundCandidates(
      [candidate({ docCode: 'demo 01' })],
      [rule()],
      SCOPE,
    )
    expect(result.findings).toHaveLength(1)
  })
})

// --- model supplied clause text ---------------------------------------------

describe('clause text the model supplies', () => {
  it('is never used in the citation, even when the rule resolves', () => {
    const fabricated = 'لا يقل الارتداد الأمامي عن ٦٫٠٠ أمتار' // wrong figure
    const result = groundCandidates(
      [candidate({ quotedClauseText: fabricated })],
      [rule()],
      SCOPE,
    )

    const finding = result.findings[0]!
    expect(finding.citation.clauseTextAr).toBe(VERBATIM_FRONT_SETBACK)
    expect(finding.citation.clauseTextAr).not.toContain('٦٫٠٠')
    expect(JSON.stringify(finding)).not.toContain(fabricated)
  })

  it('is flagged as a divergence when it does not match the loaded clause', () => {
    const result = groundCandidates(
      [candidate({ quotedClauseText: 'لا يقل الارتداد الأمامي عن ٦٫٠٠ أمتار' })],
      [rule()],
      SCOPE,
    )

    expect(result.divergences).toHaveLength(1)
    expect(result.divergences[0]!.clauseNumber).toBe('F.1.1')
    expect(result.divergences[0]!.loaded).toBe(VERBATIM_FRONT_SETBACK)
  })

  it('is not flagged when the model quoted part of the real clause', () => {
    const result = groundCandidates(
      [candidate({ quotedClauseText: 'لا يقل الارتداد الأمامي للفيلا السكنية' })],
      [rule()],
      SCOPE,
    )
    expect(result.divergences).toHaveLength(0)
  })

  it('is not flagged for orthographic differences alone', () => {
    // Same clause, different alef spelling. Not a fabrication.
    const respelled = VERBATIM_FRONT_SETBACK.replace('الأمامي', 'الامامي')
    expect(respelled).not.toBe(VERBATIM_FRONT_SETBACK)

    const result = groundCandidates(
      [candidate({ quotedClauseText: respelled })],
      [rule()],
      SCOPE,
    )
    expect(result.divergences).toHaveLength(0)
    expect(result.findings[0]!.citation.clauseTextAr).toBe(VERBATIM_FRONT_SETBACK)
  })
})

// --- fixtures ---------------------------------------------------------------

describe('fixture code documents', () => {
  const fixtureRule = rule({ isFixture: true, codeSystem: 'FIXTURE', docCode: 'FIXTURE-VILLA-01' })

  it('cannot produce a finding by default', () => {
    const result = groundCandidates([candidate()], [fixtureRule], SCOPE)
    expect(result.findings).toHaveLength(0)
    expect(result.rejections[0]!.reason).toBe('fixture_code_not_permitted')
  })

  it('is omitted from not checked as well, so a report never mentions it', () => {
    const result = groundCandidates([candidate()], [fixtureRule], SCOPE)
    expect(result.notChecked).toHaveLength(0)
  })

  it('produces a finding when fixtures are explicitly permitted', () => {
    const result = groundCandidates([candidate()], [fixtureRule], {
      ...SCOPE,
      allowFixtures: true,
    })
    expect(result.findings).toHaveLength(1)
    expect(result.findings[0]!.citation.isFixture).toBe(true)
  })
})

// --- scope ------------------------------------------------------------------

describe('scope', () => {
  it('drops a rule that does not apply to this building type', () => {
    const result = groundCandidates(
      [candidate()],
      [rule({ buildingType: 'commercial' })],
      SCOPE,
    )
    expect(result.findings).toHaveLength(0)
    expect(result.rejections[0]!.reason).toBe('rule_out_of_scope')
  })

  it('drops a rule from another jurisdiction', () => {
    const result = groundCandidates(
      [candidate()],
      [rule({ jurisdiction: 'KSA/Jeddah' })],
      SCOPE,
    )
    expect(result.findings).toHaveLength(0)
    expect(result.rejections[0]!.reason).toBe('rule_out_of_scope')
  })
})

// --- ambiguity --------------------------------------------------------------

describe('an ambiguous rule key', () => {
  const zoneA = rule({ ruleId: 'r-a', zoneCode: 'R1', clauseNumber: 'F.1.1', clauseId: 'c-a' })
  const zoneB = rule({ ruleId: 'r-b', zoneCode: 'R2', clauseNumber: 'F.1.9', clauseId: 'c-b' })

  it('is dropped when the key matches more than one rule and the zone does not decide', () => {
    const result = groundCandidates(
      [candidate({ ruleKey: 'setback.front.min' })],
      [zoneA, zoneB],
      { ...SCOPE, zoneCode: 'R3' },
    )
    expect(result.findings).toHaveLength(0)
    expect(result.rejections[0]!.reason).toBe('ambiguous_rule_reference')
    expect(result.rejections[0]!.detail).toContain('F.1.1')
    expect(result.rejections[0]!.detail).toContain('F.1.9')
  })

  it('resolves when the submission zone picks exactly one', () => {
    const result = groundCandidates(
      [candidate({ ruleKey: 'setback.front.min' })],
      [zoneA, zoneB],
      { ...SCOPE, zoneCode: 'R2' },
    )
    expect(result.findings).toHaveLength(1)
    expect(result.findings[0]!.citation.clauseNumber).toBe('F.1.9')
  })

  it('resolves unambiguously when a rule id is given', () => {
    const result = groundCandidates(
      [candidate({ ruleKey: undefined, ruleId: 'r-b' })],
      [zoneA, zoneB],
      { ...SCOPE, zoneCode: 'R3' },
    )
    expect(result.findings).toHaveLength(1)
    expect(result.findings[0]!.citation.clauseNumber).toBe('F.1.9')
  })
})

// --- coverage ---------------------------------------------------------------

describe('coverage', () => {
  it('reports every rule with no candidate as not checked', () => {
    const rules = [
      rule({ ruleId: 'r1', ruleKey: 'setback.front.min' }),
      rule({ ruleId: 'r2', ruleKey: 'height.max', clauseNumber: 'F.2.1', clauseId: 'c2' }),
      rule({ ruleId: 'r3', ruleKey: 'parking.count.min', clauseNumber: 'F.4.1', clauseId: 'c3' }),
    ]

    const result = groundCandidates(
      [candidate({ ruleKey: 'setback.front.min' })],
      rules,
      SCOPE,
    )

    expect(result.findings).toHaveLength(1)
    expect(result.notChecked.map((n) => n.rule.ruleKey).sort()).toEqual([
      'height.max',
      'parking.count.min',
    ])
    for (const entry of result.notChecked) {
      expect(entry.reason).toBe('no_candidate')
      expect(entry.detailAr).not.toBe('')
    }
  })

  it('never leaves a rule silently absent from both lists', () => {
    const rules = [
      rule({ ruleId: 'r1' }),
      rule({ ruleId: 'r2', ruleKey: 'height.max', clauseNumber: 'F.2.1', clauseId: 'c2' }),
    ]

    const result = groundCandidates(
      [candidate({ ruleKey: 'height.max', clauseNumber: 'wrong' })],
      rules,
      SCOPE,
    )

    const accounted = new Set([
      ...result.findings.map((f) => f.ruleId),
      ...result.notChecked.map((n) => n.rule.ruleId),
    ])
    expect(accounted).toEqual(new Set(['r1', 'r2']))
  })

  it('distinguishes a suppressed rule from one that simply had no data', () => {
    const rules = [
      rule({ ruleId: 'r1' }),
      rule({ ruleId: 'r2', ruleKey: 'height.max', clauseNumber: 'F.2.1', clauseId: 'c2' }),
    ]

    const result = groundCandidates(
      [candidate({ ruleKey: 'height.max', clauseNumber: 'wrong' })],
      rules,
      SCOPE,
    )

    const byKey = new Map(result.notChecked.map((n) => [n.rule.ruleKey, n.reason]))
    expect(byKey.get('height.max')).toBe('suppressed_by_grounding')
    expect(byKey.get('setback.front.min')).toBe('no_candidate')
  })

  it('reports nothing at all when the corpus is empty', () => {
    const result = groundCandidates([candidate()], [], SCOPE)
    expect(result.findings).toHaveLength(0)
    expect(result.notChecked).toHaveLength(0)
    expect(result.rejections[0]!.reason).toBe('unknown_rule')
  })
})

// --- location ---------------------------------------------------------------

describe('location', () => {
  it('marks a located finding as exact', () => {
    const result = groundCandidates([candidate()], [rule()], SCOPE)
    expect(result.findings[0]!.locationConfidence).toBe('exact')
    expect(result.findings[0]!.location?.sheetId).toBe('A-101')
  })

  it('still reports a finding with no coordinate, marked unknown', () => {
    // Deliberate. Dropping a real setback failure for want of a pixel position
    // would hide a genuine problem; the citation is what makes it trustworthy.
    const result = groundCandidates([candidate({ location: null })], [rule()], SCOPE)
    expect(result.findings).toHaveLength(1)
    expect(result.findings[0]!.locationConfidence).toBe('unknown')
    expect(result.findings[0]!.location).toBeNull()
  })
})

// --- passes -----------------------------------------------------------------

describe('passing findings', () => {
  it('are grounded to the same standard as failures', () => {
    const result = groundCandidates(
      [candidate({ outcome: 'pass', observedValue: 3.5, clauseNumber: '9.9.9' })],
      [rule()],
      SCOPE,
    )
    // A pass citing a clause that is not the rule's clause is still dropped: a
    // wrongly grounded pass tells an engineer they are safe when nobody checked.
    expect(result.findings).toHaveLength(0)
    expect(result.rejections[0]!.reason).toBe('clause_reference_mismatch')
  })
})


// --- reproduction rights ----------------------------------------------------

describe('reproduction rights', () => {
  it('shows verbatim clause text when the rights holder permits it', () => {
    const result = groundCandidates([candidate()], [rule()], SCOPE)
    const body = citationBody(result.findings[0]!.citation)
    expect(body).toEqual({ kind: 'verbatim', text: VERBATIM_FRONT_SETBACK })
  })

  it('falls back to our own restatement when reproduction is not permitted', () => {
    // The corpus nulls clause text for an unlicensed document, exactly as the
    // v_groundable_rules CASE expression does.
    const unlicensed = rule({ reproductionRights: 'not_permitted', clauseTextAr: null })
    const result = groundCandidates([candidate()], [unlicensed], SCOPE)

    expect(result.findings).toHaveLength(1)
    const body = citationBody(result.findings[0]!.citation)
    expect(body?.kind).toBe('restatement')
    expect(body?.text).toBe('الارتداد الأمامي لا يقل عن ٣٫٠٠ أمتار')
  })

  it('still cites the clause number and page when the text cannot be shown', () => {
    // Grounding is unaffected by licensing. The finding is still tied to a real
    // clause a reader can go and open.
    const unlicensed = rule({ reproductionRights: 'not_permitted', clauseTextAr: null })
    const citation = groundCandidates([candidate()], [unlicensed], SCOPE).findings[0]!.citation

    expect(citation.clauseNumber).toBe('F.1.1')
    expect(citation.sourcePage).toBe(3)
    expect(citation.sourceUrl).toBe('https://example.gov.sa/doc.pdf')
  })

  it('treats unknown rights exactly as not permitted', () => {
    const unknown = rule({ reproductionRights: 'unknown', clauseTextAr: null })
    const citation = groundCandidates([candidate()], [unknown], SCOPE).findings[0]!.citation
    expect(citationBody(citation)?.kind).toBe('restatement')
  })

  it('never emits verbatim text when rights are not permitted, even if text leaked through', () => {
    // Defence in depth: if a future change to the read path forgot the CASE
    // expression, citationBody still refuses to publish the text.
    const leaky = rule({ reproductionRights: 'not_permitted', clauseTextAr: VERBATIM_FRONT_SETBACK })
    const citation = groundCandidates([candidate()], [leaky], SCOPE).findings[0]!.citation
    const body = citationBody(citation)

    expect(body?.kind).toBe('restatement')
    expect(body?.text).not.toBe(VERBATIM_FRONT_SETBACK)
  })

  it('suppresses a finding that has neither licensed text nor a restatement', () => {
    const empty = rule({ reproductionRights: 'not_permitted', clauseTextAr: null, summaryAr: null })
    const result = groundCandidates([candidate()], [empty], SCOPE)

    expect(result.findings).toHaveLength(0)
    expect(result.rejections[0]!.reason).toBe('no_publishable_body')
    expect(result.notChecked[0]!.reason).toBe('suppressed_by_grounding')
  })
})
