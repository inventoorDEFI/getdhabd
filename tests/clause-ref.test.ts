import { describe, expect, it } from 'vitest'
import {
  canonicaliseClauseRef,
  canonicaliseDocCode,
  clauseRefSegments,
  clauseRefsEqual,
} from '@/lib/rules/clause-ref.js'

describe('clause reference canonicalisation', () => {
  it('leaves an already canonical reference alone', () => {
    expect(canonicaliseClauseRef('1004.3.2')).toBe('1004.3.2')
  })

  it('unifies separators', () => {
    for (const variant of ['1004-3-2', '1004/3/2', '1004_3_2', '1004,3,2', '1004–3–2']) {
      expect(canonicaliseClauseRef(variant)).toBe('1004.3.2')
    }
  })

  it('folds Arabic-Indic digits and the Arabic decimal separator used as a dot', () => {
    expect(canonicaliseClauseRef('١٠٠٤٫٣٫٢')).toBe('1004.3.2')
  })

  it('strips English and Arabic label prefixes', () => {
    expect(canonicaliseClauseRef('Section 1004.3.2')).toBe('1004.3.2')
    expect(canonicaliseClauseRef('Sec. 1004.3.2')).toBe('1004.3.2')
    expect(canonicaliseClauseRef('المادة 1004.3.2')).toBe('1004.3.2')
    expect(canonicaliseClauseRef('بند ١٠٠٤.٣.٢')).toBe('1004.3.2')
  })

  it('strips invisible marks that would otherwise defeat comparison', () => {
    const withMarks = '‫1004.3.2‬'
    expect(withMarks).not.toBe('1004.3.2')
    expect(canonicaliseClauseRef(withMarks)).toBe('1004.3.2')
  })

  it('trims stray leading and trailing separators', () => {
    expect(canonicaliseClauseRef('.1004.3.2.')).toBe('1004.3.2')
    expect(canonicaliseClauseRef('1004..3')).toBe('1004.3')
  })

  it('preserves alphanumeric references such as the fixture ones', () => {
    expect(canonicaliseClauseRef('F.1.1')).toBe('f.1.1')
    expect(clauseRefsEqual('F.1.1', 'f-1-1')).toBe(true)
  })

  it('does not treat different clauses as equal', () => {
    expect(clauseRefsEqual('1004.3.2', '1004.3.3')).toBe(false)
    expect(clauseRefsEqual('1004.3', '1004.3.2')).toBe(false)
    // The failure that matters most: a transposition.
    expect(clauseRefsEqual('1004.3.2', '1004.2.3')).toBe(false)
  })

  it('splits into level segments', () => {
    expect(clauseRefSegments('Section ١٠٠٤-٣-٢')).toEqual(['1004', '3', '2'])
    expect(clauseRefSegments('')).toEqual([])
  })
})

describe('document code canonicalisation', () => {
  it('ignores spacing, case and punctuation', () => {
    for (const variant of ['SBC 201', 'sbc-201', 'SBC201', 'sbc_201', 'S B C 2 0 1']) {
      expect(canonicaliseDocCode(variant)).toBe('sbc201')
    }
  })

  it('keeps different documents distinct', () => {
    expect(canonicaliseDocCode('SBC 201')).not.toBe(canonicaliseDocCode('SBC 801'))
  })
})
