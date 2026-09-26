/**
 * Clause reference canonicalisation.
 *
 * The same clause gets written as "1004.3.2", "1004-3-2", "١٠٠٤٫٣٫٢",
 * "Sec. 1004.3.2" and "المادة ١٠٠٤/٣/٢". Comparing raw strings means a correct
 * citation gets rejected as unknown, which pushes engineers to distrust the
 * suppression and is therefore its own kind of failure.
 */

import { foldDigits } from '../arabic/digits'

/** Labels that precede a clause number and carry no identity. */
const LABEL_PREFIXES = [
  'clause', 'cl', 'section', 'sec', 'sect', 'article', 'art', 'item', 'para', 'paragraph',
  'المادة', 'مادة', 'البند', 'بند', 'الفقرة', 'فقرة', 'القسم', 'قسم',
]

/** Invisible marks that hide inside otherwise identical references. */
const INVISIBLE_IN_REFS = new RegExp(
  '[\\u061C\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u2069\\uFEFF]',
  'gu',
)

/** Separators that all mean "next level down". */
const SEPARATORS = /[.\-–—_/\\،,:٫]+/gu

export function canonicaliseClauseRef(input: string): string {
  let s = input.normalize('NFKC')

  // Invisible marks first: they hide inside otherwise identical references.
  s = s.replace(INVISIBLE_IN_REFS, '')
  s = foldDigits(s)
  s = s.toLowerCase().trim()

  for (const prefix of LABEL_PREFIXES) {
    const pattern = new RegExp(`^${prefix}\\s*[.:]?\\s*`, 'iu')
    if (pattern.test(s)) {
      s = s.replace(pattern, '')
      break
    }
  }

  s = s.replace(/\s+/gu, '')
  s = s.replace(SEPARATORS, '.')
  s = s.replace(/^\.+|\.+$/gu, '')
  s = s.replace(/\.{2,}/gu, '.')

  return s
}

/** Splits a canonical reference into its level segments. */
export function clauseRefSegments(input: string): string[] {
  const canonical = canonicaliseClauseRef(input)
  return canonical === '' ? [] : canonical.split('.')
}

export function clauseRefsEqual(a: string, b: string): boolean {
  return canonicaliseClauseRef(a) === canonicaliseClauseRef(b)
}

/** Canonical form of a document code, e.g. "SBC-201" and "sbc 201" both to "sbc201". */
export function canonicaliseDocCode(input: string): string {
  return foldDigits(input.normalize('NFKC'))
    .toLowerCase()
    .replace(/[\s\-_.]+/gu, '')
}
