import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BRAND,
  COLOURS,
  LOGO,
  SEVERITY,
  SURFACES,
  SYMBOL_PATHS,
  VERDICT,
} from '@/lib/brand.js'

/**
 * Brand drift is the kind of thing nobody notices until a client sees a report
 * in the wrong grey. These tests tie the token module, the stylesheet and the
 * supplied artwork together so the three cannot diverge silently.
 */

const ROOT = resolve(import.meta.dirname, '..')
const PUBLIC_BRAND = resolve(ROOT, 'public/brand')
const CSS = readFileSync(resolve(ROOT, 'src/styles/brand.css'), 'utf8')

const HEX = /^#[0-9A-F]{6}$/

function svg(name: string): string {
  return readFileSync(resolve(PUBLIC_BRAND, name), 'utf8')
}

function fillsIn(source: string): string[] {
  return [...source.matchAll(/fill="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1]!.toUpperCase())
}

/** Reads a custom property out of brand.css. */
function cssVar(name: string): string {
  const match = CSS.match(new RegExp(`--${name}:\\s*([^;]+);`))
  if (match == null) throw new Error(`--${name} is not defined in brand.css`)
  return match[1]!.trim()
}

// --- the palette is well formed ---------------------------------------------

describe('colour tokens', () => {
  const all: Array<[string, string]> = [
    ...Object.entries(COLOURS).map(([k, v]) => [`COLOURS.${k}`, v] as [string, string]),
    ...Object.entries(SURFACES).map(([k, v]) => [`SURFACES.${k}`, v] as [string, string]),
    ...Object.entries(SEVERITY).map(([k, v]) => [`SEVERITY.${k}`, v] as [string, string]),
    ...Object.entries(VERDICT).flatMap(([group, tones]) =>
      Object.entries(tones).map(([tone, v]) => [`VERDICT.${group}.${tone}`, v] as [string, string]),
    ),
  ]

  it.each(all)('%s is a clean six digit hex', (_name, value) => {
    expect(value).toMatch(HEX)
  })

  it('has no duplicate values inside the core palette', () => {
    const core = Object.values(COLOURS)
    expect(new Set(core).size).toBe(core.length)
  })
})

// --- the tokens match the supplied artwork ----------------------------------

describe('tokens match the supplied artwork', () => {
  it('uses the ink from the logo files, not an approximation', () => {
    expect(fillsIn(svg('dhabt-symbol-ink.svg'))).toEqual([
      COLOURS.ink,
      COLOURS.ink,
      COLOURS.ink,
    ])
  })

  it('uses the reversed tone from the logo files', () => {
    expect(new Set(fillsIn(svg('dhabt-symbol-white.svg')))).toEqual(new Set([COLOURS.onInk]))
  })

  it('takes the secondary tone from the Arabic lockup, where the Latin word sits', () => {
    // The Arabic lockup sets ضبط in ink and dhabt in the secondary tone. That
    // secondary tone is COLOURS.muted, and it is where the value came from.
    const fills = new Set(fillsIn(svg('dhabt-lockup-arabic-ink.svg')))
    expect(fills).toEqual(new Set([COLOURS.ink, COLOURS.muted]))
  })

  it('takes the reversed secondary tone from the reversed lockup', () => {
    const fills = new Set(fillsIn(svg('dhabt-lockup-arabic-white.svg')))
    expect(fills).toEqual(new Set([COLOURS.onInk, COLOURS.mutedOnInk]))
  })

  it('introduces no colour the artwork does not use', () => {
    const fromArtwork = new Set<string>()
    for (const file of readdirSync(PUBLIC_BRAND).filter((f) => f.endsWith('.svg'))) {
      for (const fill of fillsIn(svg(file))) fromArtwork.add(fill)
    }
    expect(fromArtwork).toEqual(new Set(Object.values(COLOURS)))
  })

  it('keeps the inline symbol identical to the shipped file', () => {
    // If somebody tweaks the inline path data, the inline mark and the asset
    // would quietly differ. They must be the same shape.
    const fromFile = [...svg('dhabt-symbol-ink.svg').matchAll(/ d="([^"]+)"/g)].map((m) => m[1]!)
    expect(fromFile).toEqual([...SYMBOL_PATHS])
  })
})

// --- the stylesheet matches the token module --------------------------------

describe('brand.css agrees with brand.ts', () => {
  const pairs: Array<[string, string]> = [
    ['dh-ink', COLOURS.ink],
    ['dh-on-ink', COLOURS.onInk],
    ['dh-muted', COLOURS.muted],
    ['dh-muted-on-ink', COLOURS.mutedOnInk],
    ['dh-page', SURFACES.page],
    ['dh-card', SURFACES.card],
    ['dh-sunken', SURFACES.sunken],
    ['dh-line', SURFACES.line],
    ['dh-line-strong', SURFACES.lineStrong],
    ['dh-fail-fg', VERDICT.fail.fg],
    ['dh-fail-bg', VERDICT.fail.bg],
    ['dh-fail-line', VERDICT.fail.line],
    ['dh-pass-fg', VERDICT.pass.fg],
    ['dh-pass-bg', VERDICT.pass.bg],
    ['dh-pass-line', VERDICT.pass.line],
    ['dh-nc-fg', VERDICT.notChecked.fg],
    ['dh-nc-bg', VERDICT.notChecked.bg],
    ['dh-nc-line', VERDICT.notChecked.line],
    ['dh-sev-blocking', SEVERITY.blocking],
    ['dh-sev-major', SEVERITY.major],
    ['dh-sev-minor', SEVERITY.minor],
    ['dh-sev-advisory', SEVERITY.advisory],
  ]

  it.each(pairs)('--%s equals the token', (name, value) => {
    expect(cssVar(name).toUpperCase()).toBe(value.toUpperCase())
  })
})

// --- RTL is the default, not a retrofit -------------------------------------

describe('the stylesheet is RTL first', () => {
  it('uses logical properties rather than left and right', () => {
    // padding-left in a shared stylesheet is the single most common way an RTL
    // layout ends up looking like a translated LTR one.
    const physical = CSS.match(/(?:padding|margin|border)-(?:left|right)\s*:/g) ?? []
    expect(physical).toEqual([])
  })

  it('defines the Arabic face as the default UI font', () => {
    expect(CSS).toMatch(/html\[dir='rtl'\]\s*\{\s*--dh-font-ui:\s*var\(--dh-font-ar\)/)
  })

  it('isolates figures so Arabic text cannot reorder a dimension', () => {
    // "3.50" inside an RTL paragraph reorders without isolation, and a setback
    // printed as "05.3" in a compliance report is worse than no report.
    expect(CSS).toMatch(/\.dh-figure\s*\{[^}]*unicode-bidi:\s*isolate/s)
  })
})

// --- assets are present and lean --------------------------------------------

describe('assets', () => {
  it('ships every path the token module points at', () => {
    const referenced = [
      ...Object.values(LOGO.symbol),
      ...Object.values(LOGO.lockupAr),
      ...Object.values(LOGO.lockupLatin),
      ...Object.values(LOGO.wordmarkAr),
      LOGO.appIcon,
      LOGO.favicon,
    ]
    for (const path of referenced) {
      expect(() => svg(path.replace('/brand/', '')), path).not.toThrow()
    }
  })

  it('carries no C2PA manifest, which was 8 KB on a 400 byte mark', () => {
    for (const file of readdirSync(PUBLIC_BRAND).filter((f) => f.endsWith('.svg'))) {
      expect(svg(file), file).not.toContain('c2pa')
    }
  })

  it('keeps the symbol small enough to inline', () => {
    expect(svg('dhabt-symbol-ink.svg').length).toBeLessThan(600)
  })
})

// --- naming -----------------------------------------------------------------

describe('naming', () => {
  it('sets the Latin wordmark lowercase, matching the logo', () => {
    expect(BRAND.nameLatin).toBe(BRAND.nameLatin.toLowerCase())
  })

  it('carries the Arabic name as the primary', () => {
    expect(BRAND.nameAr).toBe('ضبط')
  })
})
