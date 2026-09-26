/**
 * Digit and separator handling for Arabic text.
 *
 * Drawings mix Arabic-Indic digits (٠١٢٣), Extended Arabic-Indic digits used by
 * some Persian-configured CAD installs (۰۱۲۳), and Western digits, sometimes in
 * the same dimension string. Anything that will be computed with has to be
 * folded to Western digits first.
 */

/** ٠-٩  U+0660..U+0669 */
const ARABIC_INDIC_ZERO = 0x0660
/** ۰-۹  U+06F0..U+06F9, Extended Arabic-Indic */
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0

/**
 * Separators and signs that carry numeric meaning and must be mapped, not
 * stripped. Missing U+066B turns "٣٫٥٠" into 350 instead of 3.50, which is the
 * difference between a passing setback and a failing one.
 */
const NUMERIC_PUNCTUATION: Record<string, string> = {
  '٫': '.', // ٫ Arabic decimal separator
  '٬': '',  // ٬ Arabic thousands separator
  '٪': '%', // ٪ Arabic percent sign
  '−': '-', // − minus sign
  '×': 'x', // × multiplication sign, common in "20 × 30" plot dimensions
  'ـ': '',  // ـ tatweel, sometimes padded into dimension strings
}

/**
 * Folds Arabic-Indic and Extended Arabic-Indic digits to Western digits and
 * maps numeric punctuation. Everything else is left untouched, so this is safe
 * to run over a string that still needs its letters.
 */
export function foldDigits(input: string): string {
  let out = ''

  for (const char of input) {
    const mapped = NUMERIC_PUNCTUATION[char]
    if (mapped !== undefined) {
      out += mapped
      continue
    }

    const code = char.codePointAt(0)!

    if (code >= ARABIC_INDIC_ZERO && code <= ARABIC_INDIC_ZERO + 9) {
      out += String(code - ARABIC_INDIC_ZERO)
      continue
    }

    if (code >= EXTENDED_ARABIC_INDIC_ZERO && code <= EXTENDED_ARABIC_INDIC_ZERO + 9) {
      out += String(code - EXTENDED_ARABIC_INDIC_ZERO)
      continue
    }

    out += char
  }

  return out
}

/** True when the string contains at least one digit in any of the three sets. */
export function hasAnyDigit(input: string): boolean {
  return /[0-9٠-٩۰-۹]/u.test(input)
}

/**
 * Renders a Western-digit string with Arabic-Indic digits, for Arabic UI and
 * the Arabic PDF report. Display only. Never feed the result back into a parser.
 */
export function toArabicIndicDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) =>
    String.fromCodePoint(ARABIC_INDIC_ZERO + Number(d)),
  )
}
