# ضبط / dhabd

Pre-submission compliance review for Saudi building permit applications.
An engineering consultant uploads a drawing set before submitting it through
Balady, and gets back a report listing what is likely to be rejected, with the
clause cited and the location on the drawing identified.

**Status: step 1 of 5 complete.** The rules corpus and its loader exist. Nothing
parses a PDF yet and there is no interface yet.

---

## The guarantee, and how it is enforced

The system must never invent a code clause. That is enforced structurally, in
four places, so that losing it takes four separate mistakes rather than one.

**1. A rule cannot exist without a clause.**
`rules.clause_id` is `NOT NULL REFERENCES code_clauses ON DELETE RESTRICT`. There
is no representable rule that has no clause, and a cited clause cannot be deleted.

**2. A clause cannot exist without verbatim text and a page number.**
`code_clauses.text_ar` and `page_number` are `NOT NULL`, with CHECK constraints
refusing blank text and refusing the `<<TRANSCRIBE>>` placeholder. Every clause
can be opened in the source PDF at a stated page and compared.

**3. A rule cannot produce a finding until a named human has verified its clause.**
A trigger refuses to set a rule `active` while its clause is not `verified`, and a
second trigger refuses to un-verify a clause that active rules cite. Without the
second one the first is bypassable in two statements. `verified` additionally
requires `verified_by` and `verified_at`, so verification always has a name on it.

**4. The check engine cannot see anything ungrounded.**
Reads go through the view `v_groundable_rules`, which is defined as active rules
joined to verified clauses. An ungrounded rule is not filtered out downstream, it
is absent from the engine's view of the world. The view also carries the clause
text, so holding a rule means holding its citation.

On top of those, the grounding gate in `src/lib/rules/grounding.ts` resolves every
model-proposed finding against the loaded rule set before it can reach a report:

- A candidate naming a rule that is not loaded is dropped and logged.
- A candidate pairing a real rule with a different clause number is dropped, not
  quietly corrected. Silently fixing the citation would teach the engineer to
  trust a number the model made up.
- Clause text the model supplies is never used. The citation is built only from
  the loaded clause. When the model's quotation does not match the loaded text,
  that is recorded as a divergence, because it is evidence the model is reciting
  the code from memory.
- Every rule with no surviving finding is reported as "not checked", with the
  reason. Suppression is visible to the engineer rather than looking like a pass.

Vector search over `code_clauses.embedding` exists to help a human find candidate
clauses while authoring rules. It is deliberately not part of grounding, which is
by primary key. Similarity suggests to a person, it never authorises a citation.

---

## What is loaded, and what is not

Two transcription templates are in `data/codes/`, covering the v1 checks:

| Template | Checks |
| --- | --- |
| `TEMPLATE-envelope-municipal.yaml` | setbacks front, rear, side; height; floor count; plot coverage; parking |
| `TEMPLATE-life-safety-sbc.yaml` | stair width, riser, going; corridor and door clear widths; egress travel distance and exit count |

**Both are templates, not loaded rules.** Every clause number and every clause
text in them is `<<TRANSCRIBE>>`, and the loader refuses a pack while any
placeholder remains. They have to be filled in with the source document open.
Envelope controls come from municipal building regulations, which vary by
municipality, so expect one pack per municipality. Life safety comes from the
Saudi Building Code. Confirm from your own copy which part and edition governs
each check before you write a part number into `doc_code`.

`data/codes/fixture-villa-demo.yaml` is a synthetic document with invented clause
numbers and invented figures, for developing the pipeline and for tests. Its
`code_system` is `FIXTURE`, which the grounding gate treats as unpublishable, and
every clause text opens with `[نص تجريبي]` so it says so itself if it ever
reaches a screen. Step 2 renders reports from it.

---

## Loading a real code document

```bash
cp .env.example .env          # Postgres 15+, pgvector 0.5+
npm install
npm run db:migrate
npm run db:verify-guards      # asserts the database enforces the invariants
```

Then, per document:

```bash
# 1. Transcribe. Copy a template, fill every <<TRANSCRIBE>> from the PDF.
cp data/codes/TEMPLATE-life-safety-sbc.yaml data/codes/sbc-xxx-2018.yaml

# 2. Load. Clauses land unverified, rules land draft. Nothing is checkable yet.
npm run codes:load -- data/codes/sbc-xxx-2018.yaml --source ~/codes/sbc-xxx.pdf --by "your name"

# 3. See what is waiting.
npm run codes:verify -- --doc "SBC XXX" --pending

# 4. Verify, one clause at a time, with the PDF open at the stated page.
#    The command prints the stored text and makes you type the clause number back.
npm run codes:verify -- --doc "SBC XXX" --clause 1004.3.2 --by "your name" --activate

# 5. Confirm what the system will and will not check.
npm run codes:status
```

Step 4 is the one that cannot be automated. The loader hashes the source file and
records it, so a pack transcribed from one edition cannot be loaded against
another, but only a person can confirm that the text in the database matches the
text on the page.

---

## Layout

```
public/brand/                       logo artwork, C2PA manifests stripped
src/lib/brand.ts                    brand tokens, the single source of truth
src/styles/brand.css                the same tokens as CSS custom properties
db/migrations/0001_code_rules.sql   the corpus schema, constraints, triggers, view
src/lib/arabic/normalise.ts         orthographic folding for matching
src/lib/arabic/digits.ts            Arabic-Indic digits and numeric separators
src/lib/rules/pack.ts               code pack format and validation
src/lib/rules/loader.ts             pack to clause and rule rows
src/lib/rules/grounding.ts          the gate every finding passes through
src/lib/rules/clause-ref.ts         clause reference canonicalisation
src/lib/rules/ports.ts              storage interfaces
src/lib/rules/postgres-corpus.ts    production implementation
src/lib/rules/memory-corpus.ts      in-memory implementation, mirrors the SQL invariants
scripts/                            migrate, load, verify, status, guard checks
```

## Tests

```bash
npm test
npm run typecheck
```

128 tests, concentrated on the two places silent failures hide:

- **Normalisation.** Every fold rule separately, plus idempotence, plus the
  property that the original is preserved byte for byte, plus the offset map that
  lets a match in folded text be reported at a position in the original. Codepoints
  are written as escapes throughout, because a test that uses literal Arabic cannot
  be reviewed: nobody can tell alef with hamza from bare alef in a diff.
- **Grounding.** Each test describes a way a model can produce a confident wrong
  answer and asserts it does not reach a report.

`npm run db:verify-guards` asserts the same invariants against real SQL rather
than the in-memory mirror. Run it after any change to `db/migrations`.

## Brand

The name is ضبط. The domain is getdhabd.com.

The supplied lockups set the Latin wordmark as "dhabt", ending in t, which no
longer matches the domain. Until a designer regenerates them, the app shows the
Arabic-only wordmark, which carries no Latin and is correct either way. The
lockup files are still in public/brand and are still what tests assert against. The symbol is two boundary lines with a footprint between them, which is a
plot with its setbacks, the first thing the system checks.

The palette is four values taken from the supplied artwork and nothing else:

| | | |
| --- | --- | --- |
| `#15181C` | ink | the mark, headings, body |
| `#5B6169` | secondary on light | the Latin wordmark in the Arabic lockup |
| `#C9CCD0` | secondary on ink | the same, reversed |
| `#FFFFFF` | white | surface, and the reversed mark |

Verdict colours (fail, pass, not checked) are the only saturated values in the
product. On a compliance report, colour should mean a verdict and nothing else.
"Not checked" is grey on purpose: it is neither a pass nor a warning, and dressing
it in amber would blend it into the real failures.

`src/lib/brand.ts` and `src/styles/brand.css` hold the same values twice, and
`tests/brand.test.ts` asserts they agree, that no colour appears that the artwork
does not use, that the inline symbol path data still matches the shipped SVG, and
that the stylesheet uses logical properties rather than left and right. The logo
files are served from `public/brand` with their C2PA manifests stripped, which
took the SVG payload from 107 KB to 29 KB.

See the brand kit for the identity applied to a report.

## Arabic

RTL is the default layout and Arabic is the default interface language, from step
5 onward. Normalisation folds alef forms, alef maqsura, ta marbuta, tatweel,
diacritics, bidirectional controls, presentation forms and Arabic-Indic digits,
for matching only. Verbatim clause text is stored and printed unchanged in its
own column, including its original digits, because a report that prints the folded
form misquotes the code.
