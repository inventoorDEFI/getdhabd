import { describe, expect, it } from 'vitest'
import {
  arabicEquals,
  arabicIncludes,
  foldForMatching,
  foldWithOffsetMap,
  normaliseArabic,
} from '@/lib/arabic/normalise.js'
import { foldDigits, hasAnyDigit, toArabicIndicDigits } from '@/lib/arabic/digits.js'

/**
 * Codepoints are written as escapes throughout. A test for a normalisation rule
 * that uses literal Arabic cannot be reviewed: nobody can tell alef with hamza
 * from bare alef in a diff, which is the exact confusion the code exists to fix.
 */
const ALEF = 'ا'
const ALEF_HAMZA_ABOVE = 'أ'
const ALEF_HAMZA_BELOW = 'إ'
const ALEF_MADDA = 'آ'
const ALEF_WASLA = 'ٱ'
const ALEF_MAQSURA = 'ى'
const YEH = 'ي'
const TEH_MARBUTA = 'ة'
const HEH = 'ه'
const TATWEEL = 'ـ'
const FATHA = 'َ'
const KASRA = 'ِ'
const DAMMATAN = 'ٌ'
const SHADDA = 'ّ'
const SUKUN = 'ْ'
const RLE = '‫'
const PDF_MARK = '‬'
const RLM = '‏'
const ZWJ = '‍'
const BOM = '﻿'
const ARABIC_LETTER_MARK = '؜'

describe('alef folding', () => {
  it('folds every alef form to bare alef', () => {
    const input = ALEF_HAMZA_ABOVE + ALEF_HAMZA_BELOW + ALEF_MADDA + ALEF_WASLA
    expect(foldForMatching(input)).toBe(ALEF.repeat(4))
  })

  it('makes the two spellings of the setback term match', () => {
    // الإرتدادات and الارتدادات, the same word as different people type it
    const withHamza = 'الإرتدادات'
    const withoutHamza = 'الارتدادات'
    expect(withHamza).not.toBe(withoutHamza)
    expect(arabicEquals(withHamza, withoutHamza)).toBe(true)
  })
})

describe('alef maqsura and ta marbuta', () => {
  it('folds alef maqsura to yeh', () => {
    expect(foldForMatching(ALEF_MAQSURA)).toBe(YEH)
  })

  it('folds ta marbuta to heh', () => {
    expect(foldForMatching(TEH_MARBUTA)).toBe(HEH)
  })

  it('matches مدينة against مدينه', () => {
    const withTaMarbuta = 'مدين' + TEH_MARBUTA
    const withHeh = 'مدين' + HEH
    expect(arabicEquals(withTaMarbuta, withHeh)).toBe(true)
  })
})

describe('tatweel', () => {
  it('strips tatweel wherever it appears', () => {
    const padded = 'م' + TATWEEL.repeat(4) + 'د' + TATWEEL + 'ن'
    expect(foldForMatching(padded)).toBe('مدن')
  })
})

describe('diacritics', () => {
  it('strips harakat, tanween, shadda and sukun', () => {
    const vocalised =
      'م' + FATHA + 'د' + KASRA + 'ي' + 'ن' + FATHA + TEH_MARBUTA + DAMMATAN
    expect(foldForMatching(vocalised)).toBe('مدين' + HEH)
  })

  it('strips shadda and sukun', () => {
    expect(foldForMatching('م' + SHADDA + 'د' + SUKUN)).toBe('مد')
  })

  it('strips a diacritic sitting between a letter and the next letter', () => {
    // The case that defeats a naive implementation: the mark separates the two
    // characters a substring search is looking for.
    const withMark = 'س' + FATHA + 'ل' + SHADDA + 'م'
    expect(foldForMatching(withMark)).toBe('سلم')
  })
})

describe('bidirectional and zero width controls', () => {
  it('removes embeddings, marks, joiners and the byte order mark', () => {
    const wrapped = BOM + RLE + 'ا' + RLM + 'ب' + ZWJ + ARABIC_LETTER_MARK + PDF_MARK
    expect(foldForMatching(wrapped)).toBe('اب')
  })

  it('treats a string with hidden controls as equal to the clean one', () => {
    const clean = 'مخطط'
    const dirty = RLE + 'م' + RLM + 'خط' + ZWJ + 'ط' + PDF_MARK
    expect(clean).not.toBe(dirty)
    expect(arabicEquals(clean, dirty)).toBe(true)
  })
})

describe('presentation forms', () => {
  it('normalises isolated and final presentation forms to base letters', () => {
    // U+FE8D Arabic letter alef isolated form, U+FE8E final form
    expect(foldForMatching('ﺍ')).toBe(ALEF)
    expect(foldForMatching('ﺎ')).toBe(ALEF)
  })

  it('decomposes the lam alef ligature and then folds the alef', () => {
    // U+FEF5 lam with alef with madda above, isolated form
    expect(foldForMatching('ﻵ')).toBe('ل' + ALEF)
    // U+FEFB lam with alef, isolated form
    expect(foldForMatching('ﻻ')).toBe('ل' + ALEF)
  })

  it('folds a presentation form written with a separate diacritic', () => {
    // U+FE91 beh initial form followed by fatha
    expect(foldForMatching('ﺑ' + FATHA)).toBe('ب')
  })
})

describe('digits', () => {
  it('folds Arabic-Indic digits to Western', () => {
    expect(foldDigits('٣٥٠')).toBe('350')
  })

  it('folds Extended Arabic-Indic digits to Western', () => {
    expect(foldDigits('۳۵۰')).toBe('350')
  })

  it('maps the Arabic decimal separator, not strips it', () => {
    // ٣٫٥٠ is 3.50, not 350. Getting this wrong turns a passing setback into a
    // failing one by a factor of a hundred.
    expect(foldDigits('٣٫٥٠')).toBe('3.50')
  })

  it('removes the Arabic thousands separator', () => {
    expect(foldDigits('١٬٢٣٤')).toBe('1234')
  })

  it('maps the Arabic percent sign', () => {
    expect(foldDigits('٦٠٪')).toBe('60%')
  })

  it('maps the multiplication sign used in plot dimensions', () => {
    expect(foldDigits('٢٠ × ٣٠')).toBe('20 x 30')
  })

  it('detects digits in all three sets', () => {
    expect(hasAnyDigit('12')).toBe(true)
    expect(hasAnyDigit('٣')).toBe(true)
    expect(hasAnyDigit('۳')).toBe(true)
    expect(hasAnyDigit('متر')).toBe(false)
  })

  it('renders Western digits back to Arabic-Indic for display', () => {
    expect(toArabicIndicDigits('3.50')).toBe('٣.٥٠')
  })

  it('round trips display rendering back through the fold', () => {
    expect(foldDigits(toArabicIndicDigits('1234'))).toBe('1234')
  })
})

describe('mixed and incidental', () => {
  it('lowercases Latin so English annotations match', () => {
    expect(foldForMatching('SITE PLAN')).toBe('site plan')
  })

  it('collapses runs of whitespace including no break space', () => {
    expect(foldForMatching('  a    b  ')).toBe('a b')
  })

  it('handles a mixed Arabic and English dimension annotation', () => {
    const input = 'SETBACK ٣٫٥٠ م'
    expect(foldForMatching(input)).toBe('setback 3.50 م')
  })
})

describe('the original is never touched', () => {
  it('returns the input unchanged alongside the match key', () => {
    const original = RLE + 'الإ' + FATHA + 'رتداد' + PDF_MARK
    const result = normaliseArabic(original)

    expect(result.original).toBe(original)
    expect(result.original.length).toBe(original.length)
    expect(result.matchKey).not.toBe(original)
  })

  it('preserves the original byte for byte', () => {
    const original = 'م' + SHADDA + FATHA + 'د' + TATWEEL + 'ن' + TEH_MARBUTA
    const before = Buffer.from(original, 'utf8')
    const result = normaliseArabic(original)
    const after = Buffer.from(result.original, 'utf8')

    expect(after.equals(before)).toBe(true)
  })
})

describe('fold is idempotent', () => {
  const samples = [
    ALEF_HAMZA_ABOVE + ALEF_MAQSURA + TEH_MARBUTA,
    'ﻵﺍ' + TATWEEL,
    RLE + '٣٫٥' + PDF_MARK,
    '  SITE PLAN  ',
  ]

  it.each(samples)('folding twice equals folding once: %j', (sample) => {
    const once = foldForMatching(sample)
    expect(foldForMatching(once)).toBe(once)
  })
})

describe('hamza carriers', () => {
  const withWawHamza = 'مسؤول' // مسؤول
  const withYehHamza = 'مسئول' // مسئول

  it('does not fold hamza carriers by default', () => {
    expect(arabicEquals(withWawHamza, withYehHamza)).toBe(false)
  })

  it('maps waw hamza to waw and yeh hamza to yeh when asked', () => {
    expect(foldForMatching(withWawHamza, { foldHamzaCarriers: true })).toBe('مسوول')
    expect(foldForMatching(withYehHamza, { foldHamzaCarriers: true })).toBe('مسيول')
  })

  it('drops a standalone hamza when asked', () => {
    expect(foldForMatching('ء' + ALEF, { foldHamzaCarriers: true })).toBe(ALEF)
  })
})

describe('containment', () => {
  it('finds a folded needle in a folded haystack', () => {
    const haystack = 'جدول ' + RLE + 'الإرتدادات' + PDF_MARK
    const needle = 'الارتدادات'
    expect(arabicIncludes(haystack, needle)).toBe(true)
  })
})

describe('offset map', () => {
  it('maps each folded character back to its source index', () => {
    // أ (0), fathatan (1, dropped), ب (2)
    const input = ALEF_HAMZA_ABOVE + 'ً' + 'ب'
    const { text, map } = foldWithOffsetMap(input)

    expect(text).toBe(ALEF + 'ب')
    expect(map).toEqual([0, 2])
    expect(input[map[0]!]).toBe(ALEF_HAMZA_ABOVE)
    expect(input[map[1]!]).toBe('ب')
  })

  it('keeps the map aligned through whitespace collapsing and trimming', () => {
    const { text, map } = foldWithOffsetMap(' a  b ')
    expect(text).toBe('a b')
    expect(map).toEqual([1, 2, 4])
  })

  it('produces a map the same length as the folded text', () => {
    const input = BOM + 'م' + SHADDA + TATWEEL + ' ٣٫٥ ' + 'ﻵ'
    const { text, map } = foldWithOffsetMap(input)
    expect(map.length).toBe(text.length)
  })

  it('agrees with foldForMatching on the resulting text', () => {
    const samples = [
      ALEF_HAMZA_ABOVE + 'ًب',
      'م' + TATWEEL + 'دن' + TEH_MARBUTA,
      ' SITE  PLAN ',
      RLE + '٣٫٥٠' + PDF_MARK,
    ]
    for (const sample of samples) {
      expect(foldWithOffsetMap(sample).text).toBe(foldForMatching(sample))
    }
  })

  it('maps every index to a real position in the original', () => {
    const input = 'م' + FATHA + TATWEEL + 'دين' + TEH_MARBUTA
    const { map } = foldWithOffsetMap(input)
    for (const index of map) {
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(input.length)
    }
  })
})
