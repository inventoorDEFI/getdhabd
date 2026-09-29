'use client'

import { useEffect, useState } from 'react'
import { t, type Lang } from '@/lib/i18n'

/**
 * The hero elevation, ported from design/landing.html.
 *
 * One window on the facade cycles through three states: being measured, flagged
 * at a 42% opening ratio against a 35% limit, then corrected to 33%. It is the
 * product's argument as a drawing rather than a sentence.
 *
 * The only client component on the landing page. Everything else stays a server
 * component; this one needs an interval and a media query.
 *
 * Geometry, timings and colours are the design's, unchanged.
 */

const COLOUR = { measure: '#FFFFFF', issue: '#B4413C', pass: '#3F7D58' } as const

export function HeroFigure({ lang }: { lang: Lang }) {
  // Start at the corrected state so the first paint is the resolved one, which
  // is also where prefers-reduced-motion parks permanently.
  const [phase, setPhase] = useState(2)

  useEffect(() => {
    const reduced =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    setPhase(0)
    const id = setInterval(() => setPhase((p) => (p + 1) % 4), 1900)
    return () => clearInterval(id)
  }, [])

  const fixed = phase >= 2
  const w = fixed ? 70 : 108
  const x = 280 - w / 2
  const end = x + w
  const colour = phase === 0 ? COLOUR.measure : fixed ? COLOUR.pass : COLOUR.issue

  const main =
    phase === 0
      ? t('measuring', lang)
      : `${t('ratio', lang)} ${fixed ? '33%' : '42%'} / ${t('limit', lang)} 35%`
  const sub = phase === 0 ? '…' : fixed ? t('within', lang) : t('over', lang)

  return (
    <figure className="m-0 min-w-0 flex-[1.3_1_420px] border border-slate">
      <div className="relative">
        <svg
          viewBox="0 0 560 440"
          width="100%"
          role="img"
          aria-label={t('figAlt', lang)}
          fill="none"
          strokeLinecap="square"
          className="block max-w-full [direction:ltr]"
        >
          {/* grid lines and bubbles */}
          <g stroke="#5B6169" strokeWidth="1" strokeDasharray="2 5">
            <line x1="90" y1="34" x2="90" y2="428" />
            <line x1="280" y1="34" x2="280" y2="428" />
            <line x1="470" y1="34" x2="470" y2="428" />
            <line x1="30" y1="250" x2="530" y2="250" />
            <line x1="30" y1="390" x2="530" y2="390" />
          </g>
          <g stroke="#5B6169" fill="#15181C">
            <circle cx="90" cy="22" r="11" />
            <circle cx="280" cy="22" r="11" />
            <circle cx="470" cy="22" r="11" />
            <circle cx="18" cy="250" r="11" />
            <circle cx="18" cy="390" r="11" />
          </g>
          <g fill="#C9CCD0" fontFamily="IBM Plex Mono, monospace" fontSize="11" textAnchor="middle">
            <text x="90" y="26">A</text>
            <text x="280" y="26">B</text>
            <text x="470" y="26">C</text>
            <text x="18" y="254">2</text>
            <text x="18" y="394">1</text>
          </g>

          {/* the building */}
          <g stroke="#FFFFFF">
            <line x1="40" y1="390" x2="520" y2="390" strokeWidth="2.5" />
            <rect x="90" y="80" width="380" height="310" strokeWidth="2" />
            <line x1="90" y1="110" x2="470" y2="110" strokeWidth="1" />
            <line x1="90" y1="250" x2="470" y2="250" strokeWidth="1" />
            <g strokeWidth="1.25">
              <rect x="130" y="150" width="50" height="62" />
              <rect x="380" y="150" width="50" height="62" />
              <rect x="130" y="296" width="50" height="54" />
              <rect x="380" y="296" width="50" height="54" />
              <rect x="254" y="300" width="52" height="90" />
              <line x1="280" y1="300" x2="280" y2="390" />
            </g>
          </g>

          {/* the measured window */}
          <g stroke={colour} className="[transition:stroke_.5s]">
            <rect
              x={x}
              y="146"
              width={w}
              height="72"
              strokeWidth="2.5"
              className="[transition:x_.9s_ease,width_.9s_ease,stroke_.5s]"
            />
            <line x1="280" y1="146" x2="280" y2="218" strokeWidth="1" />
            <g strokeWidth="1" className="[transition:x1_.9s,x2_.9s,stroke_.5s]">
              <line x1={x} y1="130" x2={end} y2="130" />
              <line x1={x} y1="124" x2={x} y2="138" />
              <line x1={end} y1="124" x2={end} y2="138" />
              <polyline points={`${end},146 ${end + 20},118 342,52`} />
            </g>
          </g>

          {/* fixed dimensions */}
          <g stroke="#C9CCD0" strokeWidth="1">
            <line x1="505" y1="80" x2="505" y2="110" />
            <line x1="499" y1="80" x2="511" y2="80" />
            <line x1="499" y1="110" x2="511" y2="110" />
            <line x1="90" y1="416" x2="470" y2="416" />
            <line x1="90" y1="410" x2="90" y2="422" />
            <line x1="470" y1="410" x2="470" y2="422" />
          </g>
          <g fill="#C9CCD0" fontFamily="IBM Plex Mono, monospace" fontSize="11">
            <text x="515" y="99">1.20</text>
            <text x="280" y="436" textAnchor="middle">14.40</text>
          </g>
        </svg>

        <div
          aria-live="polite"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className="absolute top-[5%] left-[61%] right-[3%] border bg-ink px-3 py-2 text-[12px] leading-[1.5] [transition:border-color_.5s]"
          style={{ borderColor: colour }}
        >
          <div className="flex items-center gap-2 font-semibold">
            <span
              aria-hidden="true"
              className="h-2 w-2 flex-none [transition:background_.5s]"
              style={{ background: colour }}
            />
            <span>{main}</span>
          </div>
          <div className="mt-0.5 text-rule">{sub}</div>
        </div>
      </div>

      <figcaption className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-slate px-3.5 py-2.5 text-[12px] text-rule">
        <span>{t('figCaption', lang)}</span>
        <span className="mono">FIG. 01 · 1:100</span>
      </figcaption>
    </figure>
  )
}
