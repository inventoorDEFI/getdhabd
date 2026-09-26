/**
 * Brand tokens for ضبط / dhabd.
 *
 * Single source of truth. Colours, names and asset paths live here and nowhere
 * else, so a brand change is one edit rather than a search across components.
 * The CSS custom properties in src/styles/brand.css are generated from the same
 * values and must stay in step with them; tests/brand.test.ts asserts that.
 */

export const BRAND = {
  /** Arabic is the primary name. The logo sets Arabic in ink and Latin in grey. */
  nameAr: 'ضبط',
  /**
   * Latin name, lowercase, matching the domain getdhabd.com.
   *
   * NOTE: the supplied logo artwork still spells "dhabt" as outlined letterforms
   * in the two lockups and cannot be edited by code. Until a designer regenerates
   * them, the app shows the Arabic-only wordmark so nothing on screen contradicts
   * this. See LOGO.wordmarkAr and src/components/Logo.tsx.
   */
  nameLatin: 'dhabd',

  taglineAr: 'مراجعة مسبقة لرخص البناء',
  taglineEn: 'Pre-submission review for building permits',

  descriptionAr:
    'راجع مخططاتك قبل رفعها على بلدي، واعرف ما الذي سيُرفض ولماذا، مع نص البند النظامي كما هو.',
} as const

/**
 * The palette, exactly as it appears in the supplied artwork. Four values, no
 * more. The mark uses ink on light and white on dark, with a single secondary
 * tone for each.
 */
export const COLOURS = {
  /** Primary. The mark, headings, body text. */
  ink: '#15181C',
  /** The mark and text reversed out on ink. */
  onInk: '#FFFFFF',
  /** Secondary text on a light ground. The Latin wordmark in the Arabic lockup. */
  muted: '#5B6169',
  /** Secondary text on ink. The Latin wordmark in the reversed lockup. */
  mutedOnInk: '#C9CCD0',
} as const

/**
 * Interface accent.
 *
 * NOT from the logo. The artwork is monochrome, which is right for a mark and
 * wrong for a website: with only ink and grey the page reads as unfinished.
 *
 * Chosen as a drafting blue for two reasons. It is the colour of technical
 * drawing, which is what this audience looks at all day, so it belongs to the
 * subject rather than being decoration. And the brand ink #15181C is already a
 * blue-black, so this is analogous to it and sits quietly beside the mark
 * instead of fighting it.
 *
 * Deliberately not red, amber or green: those three are reserved for verdicts,
 * and on a compliance report colour has to mean a verdict and nothing else.
 */
export const ACCENT = {
  base: '#15548A',
  /** For large tinted surfaces. */
  soft: '#EDF3F8',
  /** Hairlines and borders on tinted surfaces. */
  line: '#C3D6E6',
  /** On ink, where the base is too dark to read. */
  onInk: '#7FB3DC',
} as const

/**
 * Derived surface and line tones.
 *
 * Every one of these is the ink hue at a reduced strength rather than a new hue,
 * so the interface stays in the two-tone world the logo establishes. Status
 * colours are the only saturated values in the product, which is deliberate: on
 * a compliance report, colour should mean a verdict and nothing else.
 */
export const SURFACES = {
  page: '#FAFAFA',
  card: '#FFFFFF',
  sunken: '#F2F3F4',
  line: '#E4E6E8',
  lineStrong: '#C9CCD0',
} as const

/**
 * Verdict colours, one per report outcome.
 *
 * "Not checked" is deliberately grey and deliberately not alarming. It is not a
 * failure and it is not a pass, and dressing it in amber would either scare
 * people off a clean drawing or blend into the real warnings.
 */
export const VERDICT = {
  fail: { fg: '#8C1D18', bg: '#FCEEEC', line: '#E8B4AE' },
  pass: { fg: '#1B5E44', bg: '#EAF5EF', line: '#A9D4BD' },
  notChecked: { fg: '#5B6169', bg: '#F2F3F4', line: '#D6D9DC' },
} as const

/** Severity, used for ordering and for the strip down the side of a finding. */
export const SEVERITY = {
  blocking: '#8C1D18',
  major: '#9A5B14',
  minor: '#5B6169',
  advisory: '#7A828C',
} as const

export const TYPE = {
  /**
   * Arabic first. IBM Plex Sans Arabic carries the geometric, slightly
   * squared feel of the wordmark and ships a matching Latin, so mixed Arabic and
   * English lines in a report sit on the same rhythm.
   */
  arabic: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', 'Segoe UI', system-ui, sans-serif",
  latin: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
  /** Dimensions, clause numbers, anything that should align in a column. */
  mono: "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace",
} as const

/** Logo assets, served from public/brand. */
export const LOGO = {
  symbol: { ink: '/brand/dhabt-symbol-ink.svg', white: '/brand/dhabt-symbol-white.svg' },
  lockupAr: {
    ink: '/brand/dhabt-lockup-arabic-ink.svg',
    white: '/brand/dhabt-lockup-arabic-white.svg',
  },
  lockupLatin: {
    ink: '/brand/dhabt-lockup-latin-ink.svg',
    white: '/brand/dhabt-lockup-latin-white.svg',
  },
  wordmarkAr: {
    ink: '/brand/dhabt-wordmark-arabic-ink.svg',
    white: '/brand/dhabt-wordmark-arabic-white.svg',
  },
  appIcon: '/brand/dhabt-app-icon.svg',
  favicon: '/brand/dhabt-favicon.svg',
} as const

/**
 * The symbol as inline path data.
 *
 * Two boundary lines with a footprint between them. Inline rather than an <img>
 * so it can take currentColor and sit in a button or a heading without a second
 * network request. viewBox is 24 by 24, matching the supplied artwork exactly.
 */
export const SYMBOL_PATHS = [
  'M 2.5 1.5 L 4.7 1.5 L 4.7 17 L 2.5 17 Z',
  'M 19.3 7 L 21.5 7 L 21.5 22.5 L 19.3 22.5 Z',
  'M 13.2 5.6 L 17.6 11.2 L 10.8 18.4 L 6.4 12.8 Z',
] as const

/**
 * Minimum clear space around the lockup, as a multiple of the symbol's width.
 * Standard practice, recorded here so it is enforceable rather than folklore.
 */
export const CLEAR_SPACE_RATIO = 0.5

/** Smallest sizes the marks stay legible at. */
export const MIN_SIZES = {
  /** Symbol, in pixels. Below this the gap between bar and diamond closes up. */
  symbolPx: 16,
  /** Arabic lockup, in pixels of width. Below this the Latin line is unreadable. */
  lockupArPx: 120,
  lockupLatinPx: 140,
} as const
