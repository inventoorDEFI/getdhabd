# Landing page work, notes for Rand

Branch `feat/landing-page`. Written as I went. Read the conflicts section first:
four premises in the brief do not match the repository, and two of them change
what the page is allowed to say.

---

## Step 0, orientation

### Framework and routing
- Next.js 15.5.26, React 19.3.0, App Router.
- Routes are directories under `app/`, each with `page.tsx`.
- TypeScript strict. `npm run typecheck` exists.
- **There is no linter configured.** No `lint` script, no ESLint config. I ran
  the type check and the production build instead, and say so in Step 4.

### Routes that exist today
| Route | Renders |
| --- | --- |
| `/` | Landing page (already exists, see conflict 2) |
| `/review` | The tool: upload form, plot inputs, corpus counters |
| `/reports/demo` | Full sample compliance report |
| `/corpus` | Table of clauses currently loaded and checkable |

All four must still work at the end. They do; see Step 4.

### What the app actually does today
Reading the code rather than the brief:

- **A rules corpus.** Clause records carrying verbatim source text, a part and
  clause number, a page number, and a SHA-256 of the source file.
- **A grounding gate.** Every model-proposed finding is resolved against loaded
  rules. Anything that cannot be tied to a loaded clause is dropped and logged,
  and its rule is reported as "not checked" rather than omitted.
- **A reproduction-rights gate.** Neither the Saudi Building Code Center nor
  MOMAH grants commercial reuse, so clause text is withheld unless a document is
  explicitly marked as permitted. The report shows Dhabt's own restatement plus
  a link to the source.
- **Arabic normalisation.** Alef forms, alef maqsura, ta marbuta, tatweel,
  diacritics, bidi controls, presentation forms, Arabic-Indic digits.
- **A sample report** rendered from real pipeline output, not hardcoded markup.

**Fourteen checks are implemented**, all on residential villas:
setbacks front/rear/side, building height, floor count, plot coverage ratio,
parking count, stair width, stair riser, stair going, corridor clear width,
door clear width, egress travel distance, exit count.

**Not built:** PDF parsing, dimension extraction, database connection, upload
handling. The tool page exists with the submit button deliberately disabled.
Every loaded clause is synthetic fixture data, badged `FIXTURE` in the UI.

### Language switching
`src/lib/i18n.ts` holds a `T` dictionary keyed by string, each with `ar` and
`en`. `t(key, lang)` reads it. Language comes from `?lang=en` on the URL, parsed
by `langFrom()` in `src/components/Chrome.tsx`, defaulting to Arabic. `Chrome`
sets `dir` and the font family per language. Reused as is for the landing page.

### Styling and tokens
- Tailwind v4, CSS-first. Tokens declared in `@theme` in `app/globals.css`.
- `src/lib/brand.ts` is the source of truth, mirrored in `src/styles/brand.css`.
- `tests/brand.test.ts` asserts the two agree, that the palette matches the logo
  artwork, and that the inline symbol path data matches the shipped SVG.

### Deployment
- GitHub `inventoorDEFI/getdhabd`, remote over SSH, working tree clean.
- Vercel, connected to that repo. **Production deploys trigger on push to
  `main`.** Pushing any other branch produces a preview deployment.
- The Vercel project sits in the scope `quintes-7e00b320`, which my Vercel
  credentials cannot see. I cannot read preview URLs, promote, or roll back.
  Per guardrail 5, I push the branch and stop.

---

## Conflicts between the brief and the repository

### 1. The domain in the brief does not exist
The brief says the site is live at **getdhabt.com**, ending in t. That domain is
**not registered**. WHOIS returns no match.

The live site is **getdhabd.com**, ending in d, registered at NameCheap, serving
HTTP 200 with a valid certificate. The repo is `getdhabd`.

Nothing in this branch touches DNS, per guardrail 1. Flagging it because the
brief's premise is wrong, and because the brand wordmark still reads "dhabt".

### 2. The root is already a landing page
The brief says the root "opens straight into the app". It did until earlier
today. A landing page already sits at `/` and the tool already moved to
`/review`.

So this is not a first build, it is a revision: rewriting the landing content to
the brief's structure, and moving the tool from `/review` to `/app`.

### 3. Brand assets are not at `brand/logo/`
They are at `public/brand/`, ten SVGs plus PNGs, already stripped of their C2PA
`<metadata>` blocks (that stripping took them from 107 KB to 29 KB). No stop
needed; the filenames the brief lists all exist.

### 4. The app does not do what the brief's copy describes
**This is the important one.**

The brief's hero and Section 2 describe checking **elevations against the Saudi
Architecture design guidelines**: 19 architectural styles, facade opening
ratios, accent colour shares.

The app checks none of that. It has no facade check, no elevation reading, no
architectural style model. Its fourteen checks are the **plot envelope**
(setbacks, height, floors, coverage, parking) and **life safety** (stairs,
corridors, doors, egress), drawn from MOMAH building requirements and the Saudi
Building Code.

The brief says: "If Step 0 showed the app does something narrower or different,
adjust these lines to describe what it really does, and note the change." So:

- Hero and "how it works" now describe the envelope and life-safety checks.
- The Saudi Architecture guidelines material from Section 2 moved into a section
  explicitly headed **قريبًا / Coming soon**, and is described as not yet built.
- Step 2 of "how it works" was "Dhabt identifies the architectural style". There
  is no style identification. Replaced with what actually happens: the plot and
  zone determine which loaded rules apply.

**Review this.** If you would rather the page describe the facade product you
intend to build, it needs the "coming soon" framing kept, or the page will
promise something that does not exist, which is the failure mode the whole
product is built to avoid.

### 5. Monochrome instruction conflicts with your feedback an hour ago
The brief specifies five monochrome tokens and says "the brand is monochrome".
Earlier today you said the site had "no colors" and looked "so much basic", and
I added a drafting blue accent, `#15548A`.

I followed the brief: **the landing page is monochrome.** The `ACCENT` export
stays in `src/lib/brand.ts` and is still used elsewhere, so restoring it on the
landing is a small change, not a rebuild.

To compensate without colour I leaned hard on the brief's own visual direction:
drawing-sheet grid, hairline rules, a dark ink hero, a large faint symbol, and
an inline SVG technical drawing. If it still reads flat, say so and I will put
the accent back on the eyebrows, step numbers and links.

---

## Step 4, verification results

Run against `next dev` on port 4020, and a clean production build.

| Check | Result |
| --- | --- |
| Type check (`npm run typecheck`) | pass |
| Linter | **not run: no linter is configured in this repo.** No `lint` script, no ESLint config. Not added, since guardrail 7 says not to install what the page does not need. |
| Production build (`npm run build`) | pass, 7 routes |
| Unit tests (`npm test`) | 203 pass |
| `/` renders the landing in Arabic by default | yes, `dir="rtl"`, `lang="ar"` |
| English version | yes, `/?lang=en`, `dir="ltr"` |
| `/app` renders the tool formerly at `/review` | yes, upload form present |
| `/corpus` | 200, both languages |
| `/reports/demo` | 200, both languages |
| `/opengraph-image` | 200, generated from the symbol |
| Language switch on landing and in app | works both directions |
| Logo and favicon | lockup inline in header and hero, favicon `dhabt-favicon.svg` |
| Arabic font actually loads | verified with `document.fonts.check`: IBM Plex Sans Arabic, Sans and Mono all report loaded, not fallback |
| 375px, no horizontal scroll | `scrollWidth` 375 equals viewport 375 |
| Console errors | none |
| Every call to action goes to `/app` | 3 links, zero references to `/review` remain |
| No em dashes | none in any copy file |
| Forbidden content (pricing, signup, testimonials, partners, usage numbers) | none present |

---

## What changed, file by file

| File | Change |
| --- | --- |
| `app/review/` → `app/app/` | Real `git mv`. The tool is at `/app`. Not duplicated, no redirect. |
| `app/page.tsx` | Rewritten as the briefed landing: hero, 01 problem, 02 how it works, 03 what it checks, 04 why, 05 who, 06 coming soon, 07 boundaries, status, close. |
| `app/layout.tsx` | Metadata expanded: Arabic and English descriptions, canonical, `hreflang` alternates, Open Graph, Twitter card. |
| `app/opengraph-image.tsx` | New. Share card generated at build time from the symbol on white via `next/og`, which ships with Next. No new dependency. |
| `app/globals.css` | Added the brief's tokens by their own names: `slate` `#5B6169`, `wash` `#F2F3F4`, `rule` `#C9CCD0`. |
| `src/lib/i18n.ts` | Landing strings replaced with the briefed sections, Arabic and English. |
| `src/components/Chrome.tsx` | Nav and language switch repointed to `/app`. |
| `LANDING-NOTES.md` | This file. |

### On the colour tokens
I added `slate`, `wash` and `rule` rather than renaming the existing ones.
`--color-line` is `#E4E6E8` and is used across the app; redefining it to the
brief's `#C9CCD0` would have darkened every border on `/app`, `/corpus` and the
report. The landing uses `border-rule`, the app keeps `border-line`.

---

## Decisions for you to review

1. **The copy describes the envelope and life-safety checks, not facades.**
   See conflict 4. The brief's facade and architectural style material is in
   section 06 under a "قريبًا" label with an explicit line saying it is not
   built. If you want the page to lead with the facade product, that framing
   has to stay until the checks exist.

2. **The hero says Dhabt "reads your drawings".** PDF parsing is not built.
   I kept the line because it states the product's purpose and the "قيد
   التطوير" block says plainly that reading and extraction are unfinished. If
   you want the hero itself hedged, say so.

3. **The drawing is an elevation with a height check, not an opening ratio.**
   The brief asked for an opening-ratio overlay. Dhabt does not check openings,
   so the overlay measures the height limit instead, which it does check. The
   building is generic and is not any real building.

4. **Monochrome, per the brief.** This contradicts your feedback an hour ago.
   See conflict 5. One line restores the accent.

5. **The wordmark still reads "dhabt" while the domain is getdhabd.com.**
   The lockup renders only its ink paths, so the Latin is not shown anywhere,
   but the artwork files still spell it with a t.

---

## Deployment

**Not deployed. Branch pushed, unmerged, per guardrail 5.**

Production deploys trigger on push to `main`. The Vercel project sits in the
scope `quintes-7e00b320`, which my Vercel credentials cannot see, so I cannot
read the preview URL, promote a deployment, or roll one back. Merging would have
gone straight to production with no preview step I could verify, which guardrail
5 forbids.

Pushing this branch should produce a preview deployment automatically. Find its
URL in the Vercel dashboard under the branch name, or on the pull request.

### To ship it
```bash
git checkout main
git merge feat/landing-page
git push origin main
```

### To roll back
Before merging, nothing to undo; just delete the branch.

After merging, either revert the merge:
```bash
git revert -m 1 <merge-commit-sha>
git push origin main
```
or, faster, in the Vercel dashboard open Deployments, find the last good
production deployment (the one before this merge) and use "Promote to
Production". That takes effect immediately and does not need a git change.

**No DNS, nameserver or Namecheap setting was touched, per guardrail 1.**
