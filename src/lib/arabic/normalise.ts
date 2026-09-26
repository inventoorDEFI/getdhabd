/**
 * Arabic orthographic normalisation.
 *
 * Drawings carry Arabic annotations written by different people in different
 * CAD installs across a decade. "الإرتدادات" and "الارتدادات" and
 * "اﻻرتدادات" are the same word and must match each other. Folding makes that
 * possible.
 *
 * The rule that matters: folding is for matching only. The original string is
 * what the engineer reads and what the report prints, so it is preserved
 * unchanged. That is why the public entry point returns a value object holding
 * both, rather than returning a bare folded string that a caller could
 * accidentally persist in place of the source text.
 */

import { foldDigits } from './digits'

// --- character classes ------------------------------------------------------

/**
 * Bidirectional control characters and zero-width marks. CAD exports and
 * copy-paste from Word sprinkle these through Arabic text. They are invisible,
 * so nobody notices them until a string comparison fails.
 *
 * U+061C Arabic letter mark, U+200B..U+200F zero-width and LTR/RTL marks,
 * U+202A..U+202E embeddings and overrides, U+2066..U+2069 isolates,
 * U+FEFF byte order mark.
 */
const INVISIBLE_CONTROLS = new RegExp(
  '[' +
    '\\u061C' +            // Arabic letter mark
    '\\u200B-\\u200F' +    // ZWSP, ZWNJ, ZWJ, LRM, RLM
    '\\u202A-\\u202E' +    // LRE, RLE, PDF, LRO, RLO
    '\\u2060-\\u2064' +    // word joiner and invisible operators
    '\\u2066-\\u2069' +    // LRI, RLI, FSI, PDI
    '\\uFEFF' +            // byte order mark
  ']',
  'gu',
)

/** U+0640 tatweel, the kashida used to justify Arabic text. Carries no meaning. */
const TATWEEL = /\u0640/gu

/**
 * Arabic diacritics: harakat, tanween, shadda, sukun, superscript alef, Quranic
 * marks, and the Arabic-script extension marks. Stripped for matching only.
 */
const DIACRITICS = new RegExp(
  '[' +
    '\\u0610-\\u061A' +    // Arabic signs above and below
    '\\u064B-\\u065F' +    // harakat, tanween, shadda, sukun, maddah, hamza marks
    '\\u0670' +            // superscript alef
    '\\u06D6-\\u06DC' +    // Quranic marks
    '\\u06DF-\\u06E8' +
    '\\u06EA-\\u06ED' +
    '\\u08D3-\\u08E1' +    // Arabic Extended-A marks
    '\\u08E3-\\u08FF' +
  ']',
  'gu',
)

/** Letter folding, per the orthography rules for this corpus. */
const LETTER_FOLDS: Record<string, string> = {
  // alef forms: أ إ آ ٱ -> ا
  'أ': 'ا', // أ alef with hamza above
  'إ': 'ا', // إ alef with hamza below
  'آ': 'ا', // آ alef with madda above
  'ٱ': 'ا', // ٱ alef wasla
  'ٲ': 'ا', // ٲ alef with wavy hamza above
  'ٳ': 'ا', // ٳ alef with wavy hamza below
  'ٵ': 'ا', // ٵ high hamza alef
  // alef maqsura -> ya
  'ى': 'ي', // ى -> ي
  // ta marbuta -> ha
  'ة': 'ه', // ة -> ه
  // Farsi/Urdu keyboard variants that appear in Gulf CAD installs
  'ک': 'ك', // ک -> ك
  'ی': 'ي', // ی -> ي
  'ڪ': 'ك', // ڪ -> ك
}

/**
 * Hamza carriers. Off by default: the corpus rules for this product do not call
 * for it, and folding them changes the identity of words like "مسؤول". Enable
 * per call site if a specific matching problem needs it.
 */
const HAMZA_CARRIER_FOLDS: Record<string, string> = {
  'ؤ': 'و', // ؤ -> و
  'ئ': 'ي', // ئ -> ي
  'ء': '',       // ء dropped
}

// --- options ----------------------------------------------------------------

export interface FoldOptions {
  /** Fold ؤ ئ ء. Default false. */
  readonly foldHamzaCarriers?: boolean
  /** Fold Arabic-Indic digits to Western. Default true. */
  readonly foldDigits?: boolean
  /** Collapse runs of whitespace to a single space and trim. Default true. */
  readonly collapseWhitespace?: boolean
  /** Lowercase Latin characters, for mixed Arabic and English annotations. Default true. */
  readonly lowercaseLatin?: boolean
}

const DEFAULTS: Required<FoldOptions> = {
  foldHamzaCarriers: false,
  foldDigits: true,
  collapseWhitespace: true,
  lowercaseLatin: true,
}

// --- the value object -------------------------------------------------------

/**
 * A string plus its match key. Pass this around instead of a bare folded
 * string, so the verbatim source is always still in hand when a report needs to
 * quote it.
 */
export interface NormalisedText {
  /** The input, unchanged. What gets stored and displayed. */
  readonly original: string
  /** Folded form. What gets compared. Never displayed, never cited. */
  readonly matchKey: string
}

/**
 * Folds a string for matching and returns it alongside the untouched original.
 */
export function normaliseArabic(input: string, options: FoldOptions = {}): NormalisedText {
  return { original: input, matchKey: foldForMatching(input, options) }
}

/**
 * The fold itself. Order matters:
 *
 * 1. NFKC first, so Arabic Presentation Forms A and B (U+FB50..U+FDFF,
 *    U+FE70..U+FEFF) and ligatures such as ﻻ become their base letters before
 *    any other rule looks at them.
 * 2. Invisible controls next, so they cannot sit between a letter and its
 *    diacritic and defeat the diacritic strip.
 * 3. Tatweel, then diacritics.
 * 4. Letter folds last among the letter rules, operating on clean base letters.
 * 5. Digits and whitespace at the end.
 */
export function foldForMatching(input: string, options: FoldOptions = {}): string {
  const opts = { ...DEFAULTS, ...options }

  let s = input.normalize('NFKC')
  s = s.replace(INVISIBLE_CONTROLS, '')
  s = s.replace(TATWEEL, '')
  s = s.replace(DIACRITICS, '')

  const folds: Record<string, string> = opts.foldHamzaCarriers
    ? { ...LETTER_FOLDS, ...HAMZA_CARRIER_FOLDS }
    : LETTER_FOLDS

  s = replaceChars(s, folds)

  if (opts.foldDigits) s = foldDigits(s)
  if (opts.lowercaseLatin) s = s.toLowerCase()

  if (opts.collapseWhitespace) {
    // \s in a Unicode regex covers the Arabic-adjacent spaces including
    // U+00A0 no break space, which CAD exports use liberally.
    s = s.replace(/\s+/gu, ' ').trim()
  }

  return s
}

function replaceChars(input: string, table: Record<string, string>): string {
  let out = ''
  for (const char of input) {
    const mapped = table[char]
    out += mapped === undefined ? char : mapped
  }
  return out
}

// --- offset mapping ---------------------------------------------------------

/**
 * A fold plus a map from each folded character back to its index in the
 * original string.
 *
 * Needed because a match found in folded text has to be reported at a position
 * in the original drawing text. Folding deletes characters (diacritics, bidi
 * marks) and can change lengths (NFKC of a ligature), so folded offsets are not
 * original offsets. Without this map, a report highlights the wrong span.
 */
export interface FoldWithMap {
  readonly text: string
  /** map[i] is the index in `original` that produced text[i]. */
  readonly map: readonly number[]
}

export function foldWithOffsetMap(input: string, options: FoldOptions = {}): FoldWithMap {
  const opts = { ...DEFAULTS, ...options }

  const folds: Record<string, string> = opts.foldHamzaCarriers
    ? { ...LETTER_FOLDS, ...HAMZA_CARRIER_FOLDS }
    : LETTER_FOLDS

  let text = ''
  const map: number[] = []

  // Walk the original by code point, normalising each grapheme in place. NFKC
  // per character rather than over the whole string keeps offsets traceable; it
  // differs from whole-string NFKC only for sequences that recompose across
  // characters, which the diacritic strip removes anyway.
  let originalIndex = 0
  for (const char of input) {
    const width = char.length // 1 or 2 for a surrogate pair
    const produced = foldSingle(char, folds, opts)

    for (const outChar of produced) {
      text += outChar
      map.push(originalIndex)
    }

    originalIndex += width
  }

  if (opts.collapseWhitespace) {
    return collapseWithMap(text, map)
  }

  return { text, map }
}

function foldSingle(
  char: string,
  folds: Record<string, string>,
  opts: Required<FoldOptions>,
): string {
  let c = char.normalize('NFKC')
  c = c.replace(INVISIBLE_CONTROLS, '')
  c = c.replace(TATWEEL, '')
  c = c.replace(DIACRITICS, '')
  if (c === '') return ''

  c = replaceChars(c, folds)
  if (opts.foldDigits) c = foldDigits(c)
  if (opts.lowercaseLatin) c = c.toLowerCase()
  return c
}

function collapseWithMap(text: string, map: readonly number[]): FoldWithMap {
  const outText: string[] = []
  const outMap: number[] = []

  let inRun = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!
    if (/\s/u.test(char)) {
      if (!inRun) {
        outText.push(' ')
        outMap.push(map[i]!)
        inRun = true
      }
      continue
    }
    inRun = false
    outText.push(char)
    outMap.push(map[i]!)
  }

  // Trim, keeping the map aligned.
  let start = 0
  let end = outText.length
  while (start < end && outText[start] === ' ') start++
  while (end > start && outText[end - 1] === ' ') end--

  return {
    text: outText.slice(start, end).join(''),
    map: outMap.slice(start, end),
  }
}

// --- comparison helpers -----------------------------------------------------

/** Equality under folding. */
export function arabicEquals(a: string, b: string, options: FoldOptions = {}): boolean {
  return foldForMatching(a, options) === foldForMatching(b, options)
}

/** Containment under folding. */
export function arabicIncludes(haystack: string, needle: string, options: FoldOptions = {}): boolean {
  return foldForMatching(haystack, options).includes(foldForMatching(needle, options))
}
