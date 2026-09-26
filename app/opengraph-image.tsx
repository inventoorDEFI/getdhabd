import { ImageResponse } from 'next/og'
import { SYMBOL_PATHS } from '@/lib/brand'

export const alt = 'ضبط'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * The mark on white, with a hairline rule.
 *
 * Deliberately no text. Rendering Arabic here would mean shipping and loading a
 * font file into the image runtime, and the Latin wordmark currently reads
 * "dhabt" while the site is getdhabd.com, so putting it on a share card would
 * broadcast that mismatch. The symbol alone is unambiguous.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFFFFF',
        }}
      >
        <svg width="260" height="260" viewBox="0 0 24 24" fill="#15181C">
          {SYMBOL_PATHS.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
        <div style={{ width: 360, height: 2, background: '#C9CCD0', marginTop: 56 }} />
      </div>
    ),
    size,
  )
}
