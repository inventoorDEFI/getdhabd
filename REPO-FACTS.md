# REPO-FACTS

Read-only survey of `inventoorDEFI/getdhabd`. No code changed, no branch created.
Read at commit **`c5b82e1`**, which is what `origin/main` points at and what is
live on https://getdhabd.com.

> **Read this first.** The working tree is **not clean**. A `git revert` was
> started and left half-finished, so the files on disk do **not** match the
> commit or production. Everything below was read from the committed tree with
> `git show HEAD:<path>`, not from disk. See section 9.

---

## 1. Framework

| | |
| --- | --- |
| Framework | Next.js `^15.5.26` |
| React | `^19.3.0` |
| Router | **App Router** |
| Directory | **`app/`**. There is no `pages/` directory. |
| Language | TypeScript, `strict: true`, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` |
| Styling | Tailwind CSS `^4.3.3` (CSS-first, no JS config file) |
| Runtime deps | `next`, `react`, `react-dom`, `pg`, `yaml`, `zod` |
| Scripts | `dev`, `build`, `start`, `test`, `test:watch`, `typecheck`, `db:migrate`, `db:verify-guards`, `codes:load`, `codes:verify`, `codes:status` |

**There is no linter.** No `lint` script, no ESLint or Biome config anywhere.
The available gates are `npm run typecheck` and `npm run build`.

---

## 2. What renders at the root URL

**File:** `app/page.tsx`
**Component:** `LandingPage`, an async server component.

It is already a landing page, not the app. It reads `searchParams.lang`, calls
`getDemoReport()` from `src/lib/demo/corpus.ts` to list the implemented checks,
and renders seven numbered sections plus a hero and a closing call to action. It
wraps everything in `<Chrome lang={lang} current="home">`.

The app itself is at **`/app`** (`app/app/page.tsx`, component `ReviewToolPage`).

---

## 3. Language switching

**Mechanism: a URL query parameter, `?lang=en`, with Arabic as the default.**
There is no next-intl, no i18n routing config, no middleware, no cookie, no
locale segment in the path.

### Files

| File | Role |
| --- | --- |
| `src/lib/i18n.ts` | The dictionary `T`, the `Lang` type, `DIR`, and the accessor `t()` |
| `src/components/Chrome.tsx` | `langFrom()` parses the param; `Chrome` applies `dir` and the font |

### The parser, verbatim

```ts
// src/components/Chrome.tsx:79
export function langFrom(params: { lang?: string | string[] } | undefined): Lang {
  const raw = Array.isArray(params?.lang) ? params?.lang[0] : params?.lang
  return raw === 'en' ? 'en' : 'ar'
}
```

Anything that is not exactly `en` falls back to Arabic.

### The dictionary

**Yes, there is a translation object. Add landing strings to `T` in
`src/lib/i18n.ts`.** It currently holds **95 entries**.

```ts
export type Lang = 'ar' | 'en'
export const LANGS: readonly Lang[] = ['ar', 'en']
export const DIR: Record<Lang, 'rtl' | 'ltr'> = { ar: 'rtl', en: 'ltr' }

export const T = {
  productTagline: { ar: 'مراجعة مسبقة لرخص البناء', en: 'Pre-submission review for building permits' },

  navReview: { ar: 'مراجعة', en: 'Review' },
  // ...
} as const

export type StringKey = keyof typeof T

export function t(key: StringKey, lang: Lang): string {
  return T[key][lang]
}
```

**Shape of one entry, exactly as asked:**

```ts
  productTagline: { ar: 'مراجعة مسبقة لرخص البناء', en: 'Pre-submission review for building permits' },
```

Every entry is `key: { ar: string, en: string }`. `StringKey` is derived from `T`,
so adding a key makes it immediately valid for `t()` and a typo becomes a compile
error.

There is a second, separate map for check names:

```ts
export const CHECK_NAMES: Record<string, { ar: string; en: string }> = {
  'setback.front.min': { ar: 'الارتداد الأمامي', en: 'Front setback' },
  // ... 14 total
}
export function checkName(ruleKey: string, lang: Lang): string
```

### How a page consumes it

```tsx
const lang = langFrom(await searchParams)   // searchParams is a Promise in Next 15
const q = lang === 'en' ? '?lang=en' : ''   // appended to every internal link
```

---

## 4. Styling and design tokens

**Tailwind v4, CSS-first.** There is **no `tailwind.config.ts` or `.js`.** Tokens
are declared in an `@theme` block, which is what generates the utility classes.

- `app/globals.css` — the `@theme` block, base rules, utilities
- `src/styles/brand.css` — the same values as plain custom properties, for
  non-Tailwind consumers such as the future PDF report renderer
- `src/lib/brand.ts` — the TypeScript source of truth
- `postcss.config.mjs` — `{ plugins: { '@tailwindcss/postcss': {} } }`

`tests/brand.test.ts` asserts that `brand.ts` and `brand.css` agree, that the
palette matches the logo SVGs, and that the inline symbol path data matches the
shipped artwork. **Changing a colour in one place and not the other fails the
test suite.**

### The `@theme` block, verbatim

```css
@theme {
  --color-ink: #15181c;
  --color-on-ink: #ffffff;
  --color-muted: #5b6169;
  --color-muted-on-ink: #c9ccd0;

  --color-page: #fafafa;
  --color-card: #ffffff;
  --color-sunken: #f2f3f4;
  --color-line: #e4e6e8;
  --color-line-strong: #c9ccd0;

  --color-fail-fg: #8c1d18;
  --color-fail-bg: #fceeec;
  --color-fail-line: #e8b4ae;
  --color-pass-fg: #1b5e44;
  --color-pass-bg: #eaf5ef;
  --color-pass-line: #a9d4bd;
  --color-nc-fg: #5b6169;
  --color-nc-bg: #f2f3f4;
  --color-nc-line: #d6d9dc;

  /* Landing tokens, exactly as specified in the brief. */
  --color-slate: #5b6169;
  --color-wash: #f2f3f4;
  --color-rule: #c9ccd0;

  --color-accent: #15548a;
  --color-accent-soft: #edf3f8;
  --color-accent-line: #c3d6e6;
  --color-accent-on-ink: #7fb3dc;

  --color-sev-blocking: #8c1d18;
  --color-sev-major: #9a5b14;
  --color-sev-minor: #5b6169;
  --color-sev-advisory: #7a828c;

  --font-ar: 'IBM Plex Sans Arabic', 'Noto Sans Arabic', system-ui, sans-serif;
  --font-la: 'IBM Plex Sans', system-ui, -apple-system, sans-serif;
  --font-mo: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
}
```

Each `--color-x` yields `bg-x`, `text-x`, `border-x`. So `--color-ink` gives
`bg-ink`, `text-ink`, `border-ink`.

**Note for the designer: `slate`, `wash`, `rule` and `ink` are duplicates of
values that already existed under other names.** `--color-slate` and
`--color-muted` are both `#5b6169`. `--color-wash` and `--color-sunken` are both
`#f2f3f4`. `--color-rule` and `--color-line-strong` are both `#c9ccd0`. The
landing page uses the first set; the app pages use the second. They were added
side by side rather than renamed, because `--color-line` (`#e4e6e8`) is used
across the app and is a *different, lighter* grey from the brief's `line`
(`#c9ccd0`). Renaming would have changed every app border.

### Custom utility classes in `app/globals.css`

| Class | What it does |
| --- | --- |
| `.fig` | Mono, tabular numerals, `direction: ltr`, `unicode-bidi: isolate`. **For leaf nodes only.** Putting it on a flex container forces the whole row left-to-right inside an RTL page. |
| `.mono` | Mono and tabular numerals with **no** direction change. Use on containers. |
| `.latin` | Latin face, isolated LTR, inline-block |
| `.clause-quote` | Verbatim clause block, ink rule on the inline-start edge |
| `.drafting-grid` | 16px minor / 80px major grid in white alpha, for dark panels |
| `.drafting-grid-light` | Same on a light ground |
| `.eyebrow` | Mono, 11px, 0.12em letterspacing, uppercase, accent coloured |

---

## 5. Fonts

**Loaded from Google Fonts with a plain `<link>` in `app/layout.tsx`.** Not
`next/font`, not self-hosted, no local font files in the repo.

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
/>
```

**The Arabic face actually served is `IBM Plex Sans Arabic`**, weights 300, 400,
500, 600, 700. Fallback chain is `'Noto Sans Arabic', system-ui, sans-serif`.

Applied by direction, not by class:

```css
[dir='rtl'] body, body[dir='rtl'] { font-family: var(--font-ar); }
[dir='ltr'] body, body[dir='ltr'] { font-family: var(--font-la); }
```

`body` also sets `line-height: 1.75`, which is deliberately looser than a Latin
default because Arabic needs more leading at the same size.

Worth knowing: because this is a render-blocking third-party stylesheet rather
than `next/font`, there is no automatic preload or size-adjust fallback metric.
Moving to `next/font/google` would remove a network round trip and the flash.

---

## 6. Every route

Read from the committed tree.

| Path | File | Component | Rendering |
| --- | --- | --- | --- |
| `/` | `app/page.tsx` | `LandingPage` | Dynamic (server) |
| `/app` | `app/app/page.tsx` | `ReviewToolPage` | Dynamic (server) |
| `/corpus` | `app/corpus/page.tsx` | `CorpusPage` | Dynamic (server) |
| `/reports/demo` | `app/reports/demo/page.tsx` | `DemoReportPage` | Dynamic (server) |
| `/opengraph-image` | `app/opengraph-image.tsx` | `Image` | Static, generated at build |

All four pages are dynamic because each awaits `searchParams`. Every one also
accepts `?lang=en`. There are no route groups, no dynamic segments, no API
routes, no server actions, no `not-found.tsx` (Next's default 404 is used).

---

## 7. Shared layout and chrome

Two layers.

### `app/layout.tsx` — the root layout

Sets `<html lang="ar" dir="rtl">` as the **document default**. A page opts into
English rather than out of it. Holds the font links and all metadata: title,
Arabic and English descriptions, canonical and language alternates, Open Graph,
Twitter card, icons, `themeColor`, and:

```ts
robots: { index: false, follow: false },
```

**The whole site is currently `noindex`**, deliberately, because every loaded
clause is synthetic fixture data. Remove that line when a real corpus ships.

### `src/components/Chrome.tsx` — the page shell

Every page wraps its content in `<Chrome lang current>`. It provides:

- **Header**: logo linking to `/`, a three-item nav, and the language toggle
- **`<main className="mx-auto max-w-5xl px-6 pb-24">`** — the width constraint a
  landing page would inherit
- **Footer**: tagline and the string `v0.1 · step 1 of 5`

```tsx
current: 'home' | 'review' | 'corpus' | 'report'

const nav = [
  { key: 'review', href: `/app${q}`,          label: t('navReview', lang) },
  { key: 'corpus', href: `/corpus${q}`,       label: t('navCorpus', lang) },
  { key: 'report', href: `/reports/demo${q}`, label: t('navReport', lang) },
]
```

**Designer note:** a full-bleed landing section must break out of the `max-w-5xl`
`main`. The existing hero does it with `-mx-6` plus `px-6`, which works but is a
workaround. A cleaner option is a `landing` prop on `Chrome` that drops the
constraint.

Also in `src/components/`: `Logo.tsx` (`Symbol`, `Lockup`), `Verdict.tsx`
(`VerdictBadge`, `Stat`), `ClauseQuote.tsx`.

---

## 8. Deployment, previews, rollback

| | |
| --- | --- |
| Host | Vercel |
| Repo | `github.com/inventoorDEFI/getdhabd` |
| Vercel scope | `quintes-7e00b320` |
| Production | https://getdhabd.com, plus `getdhabd.vercel.app` |
| Production trigger | **Push to `main`.** No manual step. |
| Previews | **Yes.** Any non-`main` branch push gets a preview URL. |
| Build | `npm run build` → `next build` |
| Env vars | **None required.** Nothing in the rendered app touches Postgres. |

Build time is roughly 30 to 90 seconds.

### Rollback

**Fastest, no git:** Vercel dashboard → Deployments → pick the last good build →
**Promote to Production**. Instant.

**By git:**

```bash
git revert -m 1 <merge-sha> && git push origin main
```

Triggers a fresh deploy of the prior state. The most recent known-good commit
before the landing page merge is **`829beba`**.

> The Vercel project lives in a scope I cannot access with my credentials, so I
> cannot read preview URLs, promote a deployment, or roll back from the
> dashboard. Anything Vercel-side has to be done by you.

---

## 9. Working tree and remote

**Remote:** `git@github.com:inventoorDEFI/getdhabd.git` over SSH. Working.

**Branches:** `main`, `feat/landing-page`, both local and on origin.
`main` and `origin/main` are both at `c5b82e1`. Nothing unpushed.

**The working tree is NOT clean.** These changes are **staged but uncommitted**,
left over from a `git revert` that was started and abandoned:

```
D   LANDING-NOTES.md
M   app/globals.css
M   app/layout.tsx
D   app/opengraph-image.tsx
M   app/page.tsx
R100 app/app/page.tsx -> app/review/page.tsx
M   src/components/Chrome.tsx
M   src/lib/i18n.ts
```

`git revert --abort` reports "no revert in progress" because the revert *commit*
was abandoned (empty message) while the staged changes remained.

**Consequence: the files on disk currently describe the OLD site**, with the app
at `/review` and no landing page. Production and `HEAD` describe the new one.
Anyone opening the folder in an editor right now sees the pre-landing state.

Two ways to resolve, neither run here:

```bash
git reset --hard c5b82e1   # discard the staged revert, match production
git commit && git push     # finish the revert, deploy the old site
```

---

## 10. What makes moving a route harder than it looks

> The question asked about moving "the registry" from `/` to `/registry`. **There
> is no registry in this repo**, and no route by that name. I have answered for
> route moves in general, using the `/` → `/app` move that was already done as
> the worked example.

### The good news

**There is no path coupling to speak of.** Concretely:

- **No `redirects()` or `rewrites()`** in `next.config.ts`. The whole file is 20
  lines and only sets `reactStrictMode`, `serverExternalPackages: ['pg']`, and an
  `outputFileTracingIncludes` entry for `data/codes/**`.
- **No `middleware.ts`.**
- **No `sitemap.ts`, `sitemap.xml`, `robots.ts` or `robots.txt`.** Nothing
  enumerates routes. (The site is `noindex` at the metadata level instead.)
- **No `vercel.json`.**
- **No i18n routing config**, so no locale prefixes to keep in sync.
- **No generated route manifest, no breadcrumbs, no search index.**

### Every internal link in the codebase

Five, all of them template literals that append the language query:

```
app/app/page.tsx:59          href={`/reports/demo${q}`}
app/page.tsx:43              href={`/app${q}`}
app/page.tsx:168             href={`/app${q}`}
app/page.tsx:174             href={`/reports/demo${q}`}
src/components/Chrome.tsx:32 <Link href={`/${q}`}>     // logo, to home
```

Plus the `nav` array and the language-switch `href` in `Chrome.tsx`, which are
constructed rather than literal.

### The three real gotchas

1. **`Chrome`'s language-switch link is a hardcoded ternary chain over route
   paths.** Move a route and you must edit it, or the toggle sends people to the
   wrong page. It is the one place a path is duplicated:

   ```tsx
   href={`${current === 'home' ? '/' : current === 'review' ? '/app'
          : current === 'corpus' ? '/corpus' : '/reports/demo'}${otherQ}`}
   ```

   This is worth refactoring into the `nav` array before any further moves.

2. **The `current` prop union uses stale names.** It is
   `'home' | 'review' | 'corpus' | 'report'`. The value `'review'` now refers to
   the page at `/app`. The types compile and the nav highlights correctly, but
   the names no longer match the paths.

3. **`app/layout.tsx` hardcodes `canonical: '/'` and `languages: { ar: '/', en: '/?lang=en' }`.**
   These describe the root specifically. If what lives at `/` changes, update
   them or the canonical points at the wrong page.

### One non-obvious constraint

`app/page.tsx`, `app/app/page.tsx` and `app/corpus/page.tsx` all call
`getDemoReport()` from `src/lib/demo/corpus.ts`. That function reads
`data/codes/fixture-villa-demo.yaml` **at request time**, with a path built from
`process.cwd()`. Next's file tracer cannot follow a dynamic path, which is why
`outputFileTracingIncludes` exists in `next.config.ts`. **A new route that calls
`getDemoReport()` is already covered by the `'/**'` glob, but any route that
reads a different data file at runtime needs its own entry, or it will build
fine locally and return a 500 in production.**
