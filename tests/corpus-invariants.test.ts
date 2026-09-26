import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { parseCodePack } from '@/lib/rules/pack.js'
import { loadCodePack } from '@/lib/rules/loader.js'
import { CorpusIntegrityError, MemoryCorpus } from '@/lib/rules/memory-corpus.js'
import { citationBody, groundCandidates } from '@/lib/rules/grounding.js'
import type { RuleScope } from '@/lib/rules/types.js'

/**
 * The invariants asserted here are the ones db/migrations/0001_code_rules.sql
 * enforces with constraints and triggers. scripts/verify-guards.ts runs the same
 * assertions against a real database, so if the SQL and this implementation ever
 * drift, that script fails.
 */

const FIXTURE_PATH = resolve(import.meta.dirname, '../data/codes/fixture-villa-demo.yaml')
const SCOPE: RuleScope = {
  buildingType: 'residential_villa',
  jurisdiction: 'KSA',
  allowFixtures: true,
}

let corpus: MemoryCorpus

beforeEach(async () => {
  corpus = new MemoryCorpus()
  const pack = parseCodePack(parseYaml(readFileSync(FIXTURE_PATH, 'utf8')))
  await loadCodePack(pack, corpus, { loadedBy: 'tester' })
})

function ruleIdByKey(key: string): string {
  const rule = [...corpus.rules.values()].find((r) => r.ruleKey === key)
  if (!rule) throw new Error(`no rule ${key}`)
  return rule.id
}

function clauseIdByNumber(number: string): string {
  const clause = [...corpus.clauses.values()].find((c) => c.clauseNumber === number)
  if (!clause) throw new Error(`no clause ${number}`)
  return clause.id
}

// --- the activation guard, direction one ------------------------------------

describe('a rule cannot be active while its clause is unverified', () => {
  it('refuses activation', async () => {
    await expect(
      corpus.setRuleStatus(ruleIdByKey('setback.front.min'), 'active'),
    ).rejects.toThrow(CorpusIntegrityError)
  })

  it('names the clause and its status in the error', async () => {
    await expect(
      corpus.setRuleStatus(ruleIdByKey('setback.front.min'), 'active'),
    ).rejects.toThrow(/clause F.1.1 is unverified, not verified/)
  })

  it('refuses activation for a clause marked rejected', async () => {
    await corpus.setClauseVerification({
      clauseId: clauseIdByNumber('F.1.1'),
      status: 'rejected',
      verifiedBy: 'tester',
    })
    await expect(
      corpus.setRuleStatus(ruleIdByKey('setback.front.min'), 'active'),
    ).rejects.toThrow(/is rejected, not verified/)
  })

  it('refuses activation for a clause marked superseded', async () => {
    await corpus.setClauseVerification({
      clauseId: clauseIdByNumber('F.1.1'),
      status: 'superseded',
      verifiedBy: 'tester',
    })
    await expect(
      corpus.setRuleStatus(ruleIdByKey('setback.front.min'), 'active'),
    ).rejects.toThrow(/superseded/)
  })

  it('refuses an insert that tries to create an already active rule', async () => {
    await expect(
      corpus.insertRule({
        clauseId: clauseIdByNumber('F.1.1'),
        ruleKey: 'setback.front.min',
        checkType: 'setback.min',
        buildingType: 'residential_villa',
        zoneCode: null,
        jurisdiction: 'KSA',
        parameters: { min_m: 3 },
        unit: 'm',
        severity: 'blocking',
        appliesWhen: {},
        summaryAr: 'ملخص للاختبار',
        summaryEn: null,
        status: 'active',
        authoredBy: 'tester',
      }),
    ).rejects.toThrow(CorpusIntegrityError)
  })

  it('allows activation once the clause is verified', async () => {
    await corpus.setClauseVerification({
      clauseId: clauseIdByNumber('F.1.1'),
      status: 'verified',
      verifiedBy: 'م. سارة',
    })
    await expect(
      corpus.setRuleStatus(ruleIdByKey('setback.front.min'), 'active'),
    ).resolves.toBeUndefined()
  })
})

// --- the activation guard, direction two ------------------------------------

describe('a verified clause cannot be unverified while active rules cite it', () => {
  beforeEach(async () => {
    await corpus.setClauseVerification({
      clauseId: clauseIdByNumber('F.1.1'),
      status: 'verified',
      verifiedBy: 'م. سارة',
    })
    await corpus.setRuleStatus(ruleIdByKey('setback.front.min'), 'active')
  })

  it('refuses the downgrade', async () => {
    // Without this, the first guard is bypassable in two statements: verify,
    // activate, unverify. The rule stays active on an unverified clause.
    await expect(
      corpus.setClauseVerification({
        clauseId: clauseIdByNumber('F.1.1'),
        status: 'unverified',
        verifiedBy: 'tester',
      }),
    ).rejects.toThrow(/active rule\(s\) cite it/)
  })

  it('allows the downgrade once the rule is retired', async () => {
    await corpus.setRuleStatus(ruleIdByKey('setback.front.min'), 'retired')
    await expect(
      corpus.setClauseVerification({
        clauseId: clauseIdByNumber('F.1.1'),
        status: 'superseded',
        verifiedBy: 'tester',
      }),
    ).resolves.toBeUndefined()
  })

  it('keeps the rule out of the groundable set after the clause is superseded', async () => {
    await corpus.setRuleStatus(ruleIdByKey('setback.front.min'), 'retired')
    await corpus.setClauseVerification({
      clauseId: clauseIdByNumber('F.1.1'),
      status: 'superseded',
      verifiedBy: 'tester',
    })
    expect(await corpus.listGroundableRules(SCOPE)).toHaveLength(0)
  })
})

describe('verification needs a named person', () => {
  it('refuses a verified status with a blank verifier', async () => {
    await expect(
      corpus.setClauseVerification({
        clauseId: clauseIdByNumber('F.1.1'),
        status: 'verified',
        verifiedBy: '   ',
      }),
    ).rejects.toThrow(/must record who verified it/)
  })

  it('records the verifier and the time', async () => {
    await corpus.setClauseVerification({
      clauseId: clauseIdByNumber('F.1.1'),
      status: 'verified',
      verifiedBy: 'م. سارة',
      note: 'طابقت النص مع صفحة ٣',
    })
    const clause = corpus.clauses.get(clauseIdByNumber('F.1.1'))!
    expect(clause.verifiedBy).toBe('م. سارة')
    expect(clause.verifiedAt).toBeInstanceOf(Date)
  })
})

// --- what the engine can see ------------------------------------------------

describe('the groundable rule set', () => {
  it('is empty immediately after a load', async () => {
    // This is the headline property. A freshly loaded corpus checks nothing.
    expect(await corpus.listGroundableRules(SCOPE)).toHaveLength(0)
  })

  it('excludes a rule that is active but whose clause is unverified', async () => {
    // Reachable only by bypassing the guards, which is why the read path filters
    // as well rather than trusting that activation was gated.
    const rule = corpus.rules.get(ruleIdByKey('height.max'))!
    corpus.rules.set(rule.id, { ...rule, status: 'active' })

    expect(await corpus.listGroundableRules(SCOPE)).toHaveLength(0)
  })

  it('excludes a verified clause whose rule is still draft', async () => {
    await corpus.setClauseVerification({
      clauseId: clauseIdByNumber('F.2.1'),
      status: 'verified',
      verifiedBy: 'م. سارة',
    })
    expect(await corpus.listGroundableRules(SCOPE)).toHaveLength(0)
  })

  it('includes a rule only when both halves are done', async () => {
    await corpus.setClauseVerification({
      clauseId: clauseIdByNumber('F.2.1'),
      status: 'verified',
      verifiedBy: 'م. سارة',
    })
    await corpus.setRuleStatus(ruleIdByKey('height.max'), 'active')

    const groundable = await corpus.listGroundableRules(SCOPE)
    expect(groundable.map((r) => r.ruleKey)).toEqual(['height.max'])
    // The fixture document is marked not_permitted, so the corpus withholds the
    // clause text and the rule carries our restatement instead.
    expect(groundable[0]!.clauseTextAr).toBeNull()
    expect(groundable[0]!.reproductionRights).toBe('not_permitted')
    expect(groundable[0]!.summaryAr).toContain('ارتفاع الفيلا')
  })

  it('hides fixture rules when fixtures are not permitted', async () => {
    await corpus.setClauseVerification({
      clauseId: clauseIdByNumber('F.2.1'),
      status: 'verified',
      verifiedBy: 'م. سارة',
    })
    await corpus.setRuleStatus(ruleIdByKey('height.max'), 'active')

    expect(
      await corpus.listGroundableRules({ ...SCOPE, allowFixtures: false }),
    ).toHaveLength(0)
    expect(
      await corpus.listGroundableRules({
        buildingType: 'residential_villa',
        jurisdiction: 'KSA',
      }),
    ).toHaveLength(0)
  })

  it('excludes another building type', async () => {
    await corpus.setClauseVerification({
      clauseId: clauseIdByNumber('F.2.1'),
      status: 'verified',
      verifiedBy: 'م. سارة',
    })
    await corpus.setRuleStatus(ruleIdByKey('height.max'), 'active')

    expect(
      await corpus.listGroundableRules({ ...SCOPE, buildingType: 'commercial' }),
    ).toHaveLength(0)
  })
})

// --- the two pieces together ------------------------------------------------

describe('load, verify, activate, ground', () => {
  it('reports nothing before verification, not even a guess', async () => {
    const groundable = await corpus.listGroundableRules(SCOPE)
    const result = groundCandidates(
      [
        {
          ruleKey: 'setback.front.min',
          outcome: 'fail',
          observedValue: 2.4,
          observedUnit: 'm',
          quotedClauseText: 'لا يقل الارتداد الأمامي عن ٣ أمتار',
        },
      ],
      groundable,
      SCOPE,
    )

    expect(result.findings).toHaveLength(0)
    expect(result.notChecked).toHaveLength(0)
    expect(result.rejections[0]!.reason).toBe('unknown_rule')
  })

  it('reports a grounded finding after the whole chain is complete', async () => {
    await corpus.setClauseVerification({
      clauseId: clauseIdByNumber('F.1.1'),
      status: 'verified',
      verifiedBy: 'م. سارة',
    })
    await corpus.setRuleStatus(ruleIdByKey('setback.front.min'), 'active')

    const groundable = await corpus.listGroundableRules(SCOPE)
    const result = groundCandidates(
      [
        {
          ruleKey: 'setback.front.min',
          outcome: 'fail',
          observedValue: 2.4,
          observedUnit: 'm',
          location: { sheetId: 'A-101', sheetLabel: 'مخطط الموقع', pdfPage: 1, x: 200, y: 400 },
        },
      ],
      groundable,
      SCOPE,
    )

    expect(result.findings).toHaveLength(1)
    const citation = result.findings[0]!.citation
    expect(citation.clauseNumber).toBe('F.1.1')
    expect(citation.sourcePage).toBe(3)
    expect(citation.docCode).toBe('FIXTURE-VILLA-01')

    // Grounding is unaffected by licensing: the finding still points at a real
    // clause on a real page. What changes is what may be printed.
    expect(citation.clauseTextAr).toBeNull()
    const body = citationBody(citation)
    expect(body?.kind).toBe('restatement')
    // The numeric limit survives into the restatement. A limit is a fact.
    expect(body?.text).toContain('٣٫٠٠')
  })

  it('logs every rejection through the repository', async () => {
    const groundable = await corpus.listGroundableRules(SCOPE)
    const result = groundCandidates(
      [{ ruleKey: 'balcony.projection.max', outcome: 'fail' }],
      groundable,
      SCOPE,
    )

    await corpus.logGroundingRejections(result.rejections, {
      reportId: 'report-1',
      modelName: 'test-model',
    })

    expect(corpus.rejectionLog).toHaveLength(1)
    expect(corpus.rejectionLog[0]!.rejection.attemptedRuleKey).toBe('balcony.projection.max')
    expect(corpus.rejectionLog[0]!.context.reportId).toBe('report-1')
  })
})
