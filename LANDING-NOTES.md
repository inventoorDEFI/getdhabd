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

