import { SYMBOL_PATHS } from '@/lib/brand'

/**
 * The symbol, inline so it takes currentColor and costs no extra request.
 * Path data is asserted identical to public/brand/dhabt-symbol-ink.svg by
 * tests/brand.test.ts, so this cannot drift from the shipped artwork.
 */
export function Symbol({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      {SYMBOL_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

/**
 * The brand mark.
 *
 * Uses the Arabic-only wordmark (ضبط) rather than the full lockup. The lockup
 * sets the Latin wordmark as "dhabt" in outlined letterforms, and the product
 * now lives at getdhabd.com, so showing it would put a contradiction in the
 * header of every page. The Arabic wordmark carries no Latin and is correct
 * either way.
 *
 * To restore the full lockup once the artwork is regenerated, swap src back to
 * LOGO.lockupAr.ink and the aspect ratio to 365/716.
 */
export function Lockup({ width = 132, className = '' }: { width?: number; className?: string }) {
  return (
    <img
      src="/brand/dhabt-wordmark-arabic-ink.svg"
      alt="ضبط"
      width={width}
      height={Math.round((width * 270) / 480)}
      className={className}
      style={{ width, height: 'auto' }}
    />
  )
}
