# Landing redesign, notes for Rand

Branch `feat/landing-redesign`, off `main` at `c5b82e1`.
Source design: `design/landing.html`, kept in the repo as reference and not served.

---

## What the design is

A drawing-sheet layout. Dark hero (sheet A-00) with a title block, the ضبط mark
set very large, and an animated elevation where one window is measured, flagged
at a 42% opening ratio against a 35% limit, then corrected to 33%. Then six
numbered sheets on white: A-01 the problem, A-02 four steps, A-03 a report mock,
A-04 three patterns, A-05 the schedule of 19 styles, A-06 sources. Closes on a
second dark sheet (A-07) with a repeated call to action and a title-block footer.

---

## Changes, file by file

| File | Change |
| --- | --- |
| `design/landing.html` | Added. The designer's reference, unmodified apart from the filename. Sits outside `app/` and `public/`, so Next never serves it. Confirmed: `/design/landing.html` returns 404. |
| `design/_ds/...` | Added. The design-system bundle that shipped with it. Reference only, not imported by the app. |
| `app/page.tsx` | Rewritten. The full sheet layout as server components, plus local components for the title block, sheets, buttons, the report mock and the pattern elevations. |
| `src/components/landing/HeroFigure.tsx` | New, client. The animated hero elevation. The only client component on the page. |
| `src/components/landing/HtmlLang.tsx` | New, client. Syncs `<html lang>` and `<html dir>` with the page language. See decision 5. |
| `src/lib/i18n.ts` | The design's copy dictionary ported into `T`. Lists (steps, findings, sources) added as `LANDING_STEPS`, `LANDING_FINDINGS`, `LANDING_SOURCES`, since `t()` returns `string`. `ARCH_STYLES` added for the 19 names. The previous landing's keys were removed after confirming none were used outside `app/page.tsx`. |
| `app/globals.css` | Added `--color-issue` and `--color-ok`, and the `.sheet-rule` and `.sheet-wrap` utilities. |

No route changed. `/` is the landing, `/app` is the tool, `/corpus` and
`/reports/demo` are untouched.

---

## The 19 architectural styles

The design shipped a `VERIFY NAMES` placeholder repeated nineteen times. Replaced
with real names in `ARCH_STYLES` (`src/lib/i18n.ts`).

**Source:** https://architsaudi.dasc.gov.sa

**Ten were read directly off that site** and carry `verified: true`:
مرتفعات أبها · جزر فرسان · أصدار عسير · بيشة الصحراوية · النجدية الشرقية ·
ساحل تهامة · سفوح تهامة · ريف المدينة المنورة · ساحل تبوك · الحجازية الساحلية

**Nine did not render on the page I fetched**, which appears to load its style
list progressively. They are marked `verified: false` and come from corroborating
coverage that matches the verified ten exactly:
النجدية · النجدية الشمالية · المدينة المنورة · الطائف · جبال السروات · نجران ·
واحات الأحساء · القطيف · الساحل الشرقي

Corroborating sources:
- https://arabic.cnn.com/style/article/2025/03/17/saudi-architcture
- https://saudipedia.com/en/saudi-architecture-characters-map

**Review this.** Nine of nineteen are not first-party verified. The
`verified` flag is on each record so you can query it. The Arabic keeps the
official orthography with diacritics (`عِمَارَة`).

The English names are transliterations, not official. The programme publishes no
English style names, so anything shown in the English view is our rendering.

---

## Decisions to review

### 1. The design describes a product that does not exist
The biggest one, and it is a content decision, not a technical one.

The design's copy says Dhabt "reads your project elevations, identifies the
architectural style that applies to the site, and compares the design with the
Saudi Architecture design guidelines". The steps are style identification and
facade measurement. The report mock shows opening ratios, parapet heights and
colour areas.

**The app does none of that.** It has no facade check, no elevation reading and
no architectural style model. Its fourteen implemented checks are the plot
envelope (setbacks, height, floors, coverage, parking) and life safety (stairs,
corridors, doors, egress), from MOMAH requirements and the Saudi Building Code.
There is also no PDF parsing yet, so nothing reads anything.

You said to follow the design, so I ported the copy unchanged. But this ships a
landing page describing a product that does not exist, on a site whose entire
argument is that a confident wrong answer is worse than no answer.

The design does carry a disclaimer about affiliation, and the report mock is
labelled "مثال توضيحي". Neither says the product is unbuilt.

**I did not add a development-status note**, because that would be unfaithful to
a design you commissioned. Decide whether you want one before this goes public.
The previous landing had a "قيد التطوير" section for exactly this reason.

### 2. Page width: the design wins, as instructed
The design runs to 1320px. The app's `Chrome` constrains to `max-w-5xl`, 1024px.
The landing uses a `.sheet-wrap` utility at 1320px and does not use `Chrome` at
all, because the design replaces the header and footer with a title block. App
pages keep their own 1024px measure.

### 3. Verdict colours
The design uses `#B4413C` for issues and `#3F7D58` for passes, lighter than the
app's `#8C1D18` and `#1B5E44`. The design labels them "product visuals only", so
they went in as new tokens (`--color-issue`, `--color-ok`) rather than
redefining the app's. Two verdict palettes now exist. Worth reconciling later.

### 4. Language switch: app convention wins over the design's mechanism
The design switches language with a button that rewrites the URL via
`history.replaceState` and re-renders in place. The app uses `?lang=` links.

I kept the app's mechanism, styled to match. It is a real navigation, works with
JavaScript disabled, and the brief said to use the app's language switching. The
visual result is identical.

### 5. `<html dir>` and the query-parameter locale
The root layout hardcodes `lang="ar" dir="rtl"`, because a Next App Router layout
cannot read `searchParams`. On the English page the document element therefore
claimed Arabic and RTL, even though the visual layout was correct (the page sets
`dir` on its own wrapper).

`HtmlLang` now corrects it on mount, which is what the design's own script does.
Verified: `/?lang=en` reports `dir="ltr"`, `lang="en"`.

**The real fix is route-based locales** (`/ar`, `/en`) instead of a query
parameter, which is a larger change than this branch should make. The app pages
have the same behaviour and are not fixed here.

### 6. Sheet-number labels
The design hardcodes the Arabic word "المقياس" next to the scale. I left it
hardcoded to match, so it stays Arabic in the English view. Tell me if it should
be translated; it is a one-line change.

---

## Verification

Run on the branch, against `next dev` and a production build.

| Check | Result |
| --- | --- |
| Type check (`npm run typecheck`) | Pass |
| Linter | **Not run. The project has no linter.** No `lint` script, no ESLint or Biome config. Flagged in `REPO-FACTS.md`. |
| Production build (`npm run build`) | Pass, 8 static pages generated |
| Unit tests (`npm test`) | Pass |
| `/` in Arabic by default | Pass. `dir=rtl`, Arabic h1, no `lang` param needed |
| English version | Pass. `/?lang=en` gives `dir=ltr`, `lang=en`, Latin face |
| `/app` works | Pass, 200 in both languages |
| `/corpus`, `/reports/demo` | Pass, 200 in both languages |
| Language switch everywhere | Pass. Title block header and footer both carry it; all three CTAs carry `?lang=en` in the English view |
| Logo and favicon | Favicons resolve (`dhabt-favicon.svg`, `favicon-32.png`, `apple-touch-icon-180.png`). **Note:** the design sets the brand as a text wordmark in the title block, not the logo SVG, so the mark does not appear as artwork on this page. That is the design's choice, not an omission. |
| Arabic fonts and RTL | Pass. Computed font on the Arabic h1 includes `IBM Plex Sans Arabic`. No duplicate font loading: the page uses the app's existing Google Fonts link. |
| 375px, no horizontal scroll | Pass. `document.body.scrollWidth === innerWidth === 375`, no element wider than the viewport |
| Reduced motion | Pass. `HeroFigure` checks `prefers-reduced-motion` and never starts its interval, parking on the resolved state. The design's global `transition: none` rule is preserved in `globals.css`. |
| Console errors | None |
| Em dashes | None in `i18n.ts`, `app/page.tsx` or the landing components |
| `design/landing.html` not served | Pass, 404 |

---

## What I could not do

- **Linter:** none exists in this project.
- **Preview deployment:** the Vercel project is in the scope `quintes-7e00b320`,
  which my credentials cannot see. I cannot read a preview URL, promote, or roll
  back from the dashboard.
- **Production promotion:** not done, deliberately. Production deploys trigger on
  push to `main`, and per the brief I push the branch and stop.

---

## Preview and production

- **Preview URL:** not available to me. Pushing this branch produces one
  automatically; find it on the branch's deployment in Vercel, or on the PR.
- **Production reference:** unchanged. `main` is still `c5b82e1`.

---

## Rollback

Nothing shipped, so there is nothing to roll back. If you merge this and want to
undo it:

**Fastest, no git:** Vercel dashboard, Deployments, pick the build from
`c5b82e1`, Promote to Production.

**By git:**

```
git revert -m 1 <merge-sha>
git push origin main
```

To discard the branch entirely without merging:

```
git branch -D feat/landing-redesign
git push origin --delete feat/landing-redesign
```
