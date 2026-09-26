import { SYMBOL_PATHS } from '@/lib/brand'

/**
 * The symbol: two boundary lines with a footprint between them. Inline so it
 * takes currentColor. Path data is asserted identical to the shipped artwork by
 * tests/brand.test.ts.
 */
export function Symbol({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}
         aria-hidden="true" fill="currentColor">
      {SYMBOL_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

/**
 * The lockup, ink paths only.
 *
 * These are the symbol and ضبط taken verbatim from dhabt-lockup-arabic-ink.svg,
 * at their original coordinates, so the spacing between mark and wordmark is the
 * designer's and not something reconstructed. The five grey paths from that file
 * spell d-h-a-b-t in outlined letterforms and are deliberately not drawn: the
 * product lives at getdhabd.com, so rendering them would put a contradiction in
 * the header of every page.
 *
 * The viewBox is trimmed to the ink bounds (x 67..639, y 60..250) so dropping the
 * Latin leaves no empty space beneath the mark.
 *
 * When the artwork is regenerated, replace this with the full lockup file again.
 */
const LOCKUP_INK = [
  'M 214 208 Q 206.8 208 200.9 206.4 Q 195 204.8 189.8 200.6 Q 177.6 208 155.4 208 L 67.2 208 L 67.2 181.8 L 85 181.8 L 90.8 171.8 L 90.8 60 L 112 60 L 112 117.6 L 109.6 141 L 110.8 141.6 Q 122 129 134.1 123.8 Q 146.2 118.6 160.8 118.6 Q 183.2 118.6 194.7 130.8 Q 206.2 143 206.2 164.8 Q 206.2 169.4 205.7 173.5 Q 205.2 177.6 204.2 181 Q 206.6 181.4 209 181.6 Q 211.4 181.8 214 181.8 L 219.4 181.8 L 219.4 202.6 L 214 208 Z M 155.4 181.8 Q 173.2 181.8 180.6 178.1 Q 188 174.4 188 164.2 Q 188 154.4 182.2 149.6 Q 176.4 144.8 163.8 144.8 L 157.8 144.8 Q 149 144.8 142.4 145.7 Q 135.8 146.6 130.3 149.1 Q 124.8 151.6 120.2 156.1 Q 115.6 160.6 111 167.6 L 102.4 180.6 L 103 181.8 L 155.4 181.8 Z',
  'M 214 187.2 L 219.4 181.8 L 225.6 181.8 Q 242 181.8 242 166.8 L 242 137.4 L 261.6 137.4 L 261.6 166.8 Q 261.6 181.8 276.6 181.8 L 284.2 181.8 L 284.2 202.6 L 278.8 208 Q 263.4 208 255.2 202 Q 247 196 244.2 183.2 L 243.2 183.2 Q 240.6 196.4 233.9 202.2 Q 227.2 208 214 208 L 214 187.2 Z M 250 250 Q 245.2 250 242.1 247.1 Q 239 244.2 239 237.8 Q 239 231.2 242.1 228.3 Q 245.2 225.4 250 225.4 L 253.4 225.4 Q 258.2 225.4 261.3 228.3 Q 264.4 231.2 264.4 237.8 Q 264.4 244.2 261.3 247.1 Q 258.2 250 253.4 250 L 250 250 Z',
  'M 326.4 166.8 Q 326.4 176.6 332.2 179.8 L 341.4 163.8 Q 348.6 151.2 356 142.6 Q 363.4 134 371.4 128.7 Q 379.4 123.4 388.2 121 Q 397 118.6 406.8 118.6 Q 429.2 118.6 440.7 130.8 Q 452.2 143 452.2 164.8 Q 452.2 187.4 439.9 197.7 Q 427.6 208 401.4 208 L 343.6 208 Q 328.2 208 320 202 Q 311.8 196 309 183.2 L 308 183.2 Q 305.4 196.4 298.7 202.2 Q 292 208 278.8 208 L 278.8 187.2 L 284.2 181.8 L 290.4 181.8 Q 306.8 181.8 306.8 166.8 L 306.8 153.4 L 326.4 153.4 L 326.4 166.8 Z M 401.4 181.8 Q 419.2 181.8 426.6 178.1 Q 434 174.4 434 164.2 Q 434 154.4 428.2 149.6 Q 422.4 144.8 409.8 144.8 L 403.8 144.8 Q 395 144.8 388.4 145.7 Q 381.8 146.6 376.3 149.1 Q 370.8 151.6 366.2 156.1 Q 361.6 160.6 357 167.6 L 348.4 180.6 L 349 181.8 L 401.4 181.8 Z M 399 100.2 Q 394.2 100.2 391.1 97.3 Q 388 94.4 388 88 Q 388 81.4 391.1 78.5 Q 394.2 75.6 399 75.6 L 402.4 75.6 Q 407.2 75.6 410.3 78.5 Q 413.4 81.4 413.4 88 Q 413.4 94.4 410.3 97.3 Q 407.2 100.2 402.4 100.2 L 399 100.2 Z',
  'M 515.15 86.31 L 529.55 86.31 L 529.55 187.71 L 515.15 187.71 Z',
  'M 625.05 122.29 L 639.45 122.29 L 639.45 223.69 L 625.05 223.69 Z',
  'M 585.15 113.13 L 613.93 149.77 L 569.45 196.87 L 540.67 160.23 Z',
] as const

export function Lockup({ height = 30, className = '' }: { height?: number; className?: string }) {
  // Trimmed box: 20px of padding around the ink bounds.
  const vb = { x: 47, y: 40, w: 612, h: 230 }
  return (
    <svg
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      height={height}
      width={Math.round((height * vb.w) / vb.h)}
      className={className}
      role="img"
      aria-label="ضبط"
      fill="currentColor"
    >
      {LOCKUP_INK.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
