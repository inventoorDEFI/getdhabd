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
 * The Arabic lockup. Served as a file rather than inlined because it is custom
 * lettering, not type, and it is large enough that inlining it on every page
 * would cost more than the request saves.
 */
export function Lockup({ width = 132, className = '' }: { width?: number; className?: string }) {
  return (
    <img
      src="/brand/dhabt-lockup-arabic-ink.svg"
      alt="ضبط"
      width={width}
      height={Math.round((width * 365) / 716)}
      className={className}
      style={{ width, height: 'auto' }}
    />
  )
}
