-- 0001_code_rules.sql
-- Dhabt: the rules corpus.
--
-- Design rule that governs this whole file: a finding can only exist if it is
-- anchored to a row in code_clauses that carries verbatim source text and a
-- page number. There is no code path, and no column, that lets a finding carry
-- free text standing in for a clause. Enforcement is here in the database, not
-- in the application layer, because the application layer is where a future
-- refactor quietly loses it.

-- Requires Postgres 15 or newer (UNIQUE NULLS NOT DISTINCT) and pgvector 0.5+.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------

-- FIXTURE marks a synthetic document used for development and tests. It is a
-- first class value so that fake code text is impossible to confuse with real
-- code text at any layer, including in a database console.
CREATE TYPE code_system_kind AS ENUM ('SBC', 'MOMRA', 'MUNICIPAL', 'FIXTURE');

CREATE TYPE clause_verification AS ENUM (
  'unverified',  -- transcribed but no human has confirmed it against the source
  'verified',    -- a named person compared it to the source page, character by character
  'superseded',  -- a newer edition replaced it
  'rejected'     -- transcription was wrong; kept for audit, never cited
);

CREATE TYPE rule_status   AS ENUM ('draft', 'active', 'retired');
CREATE TYPE rule_severity AS ENUM ('blocking', 'major', 'minor', 'advisory');

-- ---------------------------------------------------------------------------
-- code_documents: one row per physical source document and edition
-- ---------------------------------------------------------------------------

CREATE TABLE code_documents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_system      code_system_kind NOT NULL,

  -- Short human reference as printed on the document, e.g. 'SBC 201'.
  doc_code         text        NOT NULL,
  edition_year     integer     NOT NULL CHECK (edition_year BETWEEN 1970 AND 2100),

  title_ar         text        NOT NULL CHECK (btrim(title_ar) <> ''),
  title_en         text,

  -- Provenance. source_sha256 is the hash of the exact file the clause text was
  -- transcribed from. If somebody swaps the PDF, the hash stops matching and
  -- the corpus is flagged for re-verification.
  source_file_name text        NOT NULL,
  source_sha256    char(64)    NOT NULL CHECK (source_sha256 ~ '^[0-9a-f]{64}$'),
  source_url       text,
  total_pages      integer     CHECK (total_pages > 0),

  -- Which authority this document binds. Setbacks in particular vary by
  -- municipality, so a rule is never applied outside its jurisdiction.
  jurisdiction     text        NOT NULL DEFAULT 'KSA',

  ingested_at      timestamptz NOT NULL DEFAULT now(),
  ingested_by      text        NOT NULL,

  is_fixture       boolean     GENERATED ALWAYS AS (code_system = 'FIXTURE'::code_system_kind) STORED,

  UNIQUE (code_system, doc_code, edition_year, jurisdiction)
);

COMMENT ON COLUMN code_documents.source_sha256 IS
  'SHA-256 of the source file. Clause text in this document was transcribed from that exact file.';

-- ---------------------------------------------------------------------------
-- code_clauses: one row per citable clause
-- ---------------------------------------------------------------------------

CREATE TABLE code_clauses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id         uuid NOT NULL REFERENCES code_documents (id) ON DELETE RESTRICT,

  -- Canonical clause reference exactly as printed, e.g. '1004.3.2.1'.
  clause_number       text NOT NULL CHECK (btrim(clause_number) <> ''),
  -- Same reference split into segments, for prefix queries and sorting.
  clause_path         text[] NOT NULL CHECK (cardinality(clause_path) > 0),

  part_number         text,
  chapter_number      text,
  section_number      text,

  heading_ar          text,
  heading_en          text,

  -- Verbatim clause text. Preserved byte for byte, including diacritics,
  -- spacing and the original alef and ya forms. This is what the report prints.
  text_ar             text NOT NULL
                        CHECK (btrim(text_ar) <> '')
                        CHECK (text_ar NOT LIKE '%<<TRANSCRIBE%'),
  text_en             text,

  -- Normalised copy, for matching only. Never displayed, never cited.
  text_ar_normalised  text NOT NULL CHECK (btrim(text_ar_normalised) <> ''),

  -- Where to find it in the source, so a reviewer can check in one step.
  page_number         integer NOT NULL CHECK (page_number > 0),
  -- Optional rectangle on that page, as {x0,y0,x1,y1} in PDF points.
  bbox                jsonb,

  verification_status clause_verification NOT NULL DEFAULT 'unverified',
  verified_by         text,
  verified_at         timestamptz,
  verification_note   text,

  -- Retrieval aid for clause authoring: find candidate clauses for a topic.
  -- Deliberately NOT part of the grounding decision. Grounding is by primary
  -- key. Similarity search suggests to a human; it never authorises a citation.
  embedding           vector(1536),

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  UNIQUE (document_id, clause_number),

  -- A verified clause must name who verified it and when. Verification without
  -- an accountable human is not verification.
  CONSTRAINT clause_verified_needs_attribution CHECK (
    verification_status <> 'verified'
    OR (verified_by IS NOT NULL AND btrim(verified_by) <> '' AND verified_at IS NOT NULL)
  )
);

CREATE INDEX code_clauses_document_idx  ON code_clauses (document_id);
CREATE INDEX code_clauses_path_idx      ON code_clauses USING gin (clause_path);
CREATE INDEX code_clauses_status_idx    ON code_clauses (verification_status);
-- hnsw needs pgvector 0.5.0 or newer.
CREATE INDEX code_clauses_embedding_idx ON code_clauses
  USING hnsw (embedding vector_cosine_ops);

COMMENT ON COLUMN code_clauses.text_ar IS
  'Verbatim source text. Never normalised, never rewritten. This string is what the report shows the engineer.';
COMMENT ON COLUMN code_clauses.embedding IS
  'Clause authoring aid only. Vector similarity suggests candidate clauses to a human author. It never grounds a finding.';

-- ---------------------------------------------------------------------------
-- rules: machine-checkable predicates, each derived from exactly one clause
-- ---------------------------------------------------------------------------

CREATE TABLE rules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- NOT NULL plus ON DELETE RESTRICT is the structural core: a rule without a
  -- clause cannot be represented, and a cited clause cannot be deleted.
  clause_id     uuid NOT NULL REFERENCES code_clauses (id) ON DELETE RESTRICT,

  -- Stable identifier the check engine dispatches on, e.g. 'setback.front.min'.
  rule_key      text NOT NULL CHECK (rule_key ~ '^[a-z][a-z0-9]*(\.[a-z0-9_]+)+$'),

  check_type    text NOT NULL,

  -- Applicability. v1 is residential villas only, but the columns exist so that
  -- widening scope later does not need a migration of meaning.
  building_type text NOT NULL,
  zone_code     text,
  jurisdiction  text NOT NULL DEFAULT 'KSA',

  -- Thresholds and options, shaped per check_type and validated in TypeScript.
  parameters    jsonb NOT NULL,
  unit          text,
  severity      rule_severity NOT NULL DEFAULT 'major',

  -- Extra conditions on extracted facts before the rule applies.
  applies_when  jsonb NOT NULL DEFAULT '{}'::jsonb,

  status        rule_status NOT NULL DEFAULT 'draft',

  authored_by   text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  -- NULLS NOT DISTINCT because zone_code is nullable: without it, two identical
  -- rules with no zone would both be insertable. Requires Postgres 15 or newer.
  UNIQUE NULLS NOT DISTINCT (rule_key, building_type, jurisdiction, zone_code, clause_id)
);

CREATE INDEX rules_clause_idx     ON rules (clause_id);
CREATE INDEX rules_dispatch_idx   ON rules (status, building_type, jurisdiction);

-- Supporting clauses a rule also cites. Same referential guarantee.
CREATE TABLE rule_clause_citations (
  rule_id   uuid NOT NULL REFERENCES rules (id)        ON DELETE CASCADE,
  clause_id uuid NOT NULL REFERENCES code_clauses (id) ON DELETE RESTRICT,
  relation  text NOT NULL DEFAULT 'supporting',
  PRIMARY KEY (rule_id, clause_id)
);

-- ---------------------------------------------------------------------------
-- The activation guard, in both directions
-- ---------------------------------------------------------------------------

-- Direction 1: a rule cannot become active while its clause is unverified.
CREATE OR REPLACE FUNCTION assert_active_rule_has_verified_clause()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  clause_status clause_verification;
  clause_ref    text;
BEGIN
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  SELECT verification_status, clause_number
    INTO clause_status, clause_ref
    FROM code_clauses
   WHERE id = NEW.clause_id;

  IF clause_status <> 'verified' THEN
    RAISE EXCEPTION
      'rule % cannot be active: clause % is %, not verified',
      NEW.rule_key, clause_ref, clause_status
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER rules_require_verified_clause
  BEFORE INSERT OR UPDATE OF status, clause_id ON rules
  FOR EACH ROW EXECUTE FUNCTION assert_active_rule_has_verified_clause();

-- Direction 2: a clause cannot stop being verified while active rules cite it.
-- Without this, the guard above is bypassable in two statements.
CREATE OR REPLACE FUNCTION assert_clause_not_unverified_while_cited()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  active_rules integer;
BEGIN
  IF OLD.verification_status = 'verified' AND NEW.verification_status <> 'verified' THEN
    SELECT count(*) INTO active_rules
      FROM rules
     WHERE clause_id = NEW.id AND status = 'active';

    IF active_rules > 0 THEN
      RAISE EXCEPTION
        'clause % cannot move from verified to %: % active rule(s) cite it. Retire those rules first',
        NEW.clause_number, NEW.verification_status, active_rules
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER clauses_protect_cited_verification
  BEFORE UPDATE OF verification_status ON code_clauses
  FOR EACH ROW EXECUTE FUNCTION assert_clause_not_unverified_while_cited();

-- ---------------------------------------------------------------------------
-- The only surface the check engine reads
-- ---------------------------------------------------------------------------

-- The engine never selects from rules directly. It selects from here, so a
-- rule whose clause is not verified is not merely filtered out by application
-- code, it is absent from the engine's view of the world.
CREATE VIEW v_groundable_rules AS
SELECT
  r.id            AS rule_id,
  r.rule_key,
  r.check_type,
  r.building_type,
  r.zone_code,
  r.jurisdiction,
  r.parameters,
  r.unit,
  r.severity,
  r.applies_when,
  c.id            AS clause_id,
  c.clause_number,
  c.clause_path,
  c.heading_ar,
  c.heading_en,
  c.text_ar       AS clause_text_ar,
  c.text_en       AS clause_text_en,
  c.page_number,
  c.bbox,
  d.id            AS document_id,
  d.code_system,
  d.doc_code,
  d.edition_year,
  d.title_ar      AS document_title_ar,
  d.source_sha256,
  d.is_fixture
FROM rules r
JOIN code_clauses   c ON c.id = r.clause_id
JOIN code_documents d ON d.id = c.document_id
WHERE r.status = 'active'
  AND c.verification_status = 'verified';

COMMENT ON VIEW v_groundable_rules IS
  'Active rules whose clause is verified. The check engine reads only this view. is_fixture must be filtered by the caller unless fixtures are explicitly permitted.';

-- ---------------------------------------------------------------------------
-- grounding_rejections: every suppressed finding leaves a trace
-- ---------------------------------------------------------------------------

-- When the model proposes a finding that cannot be tied to a loaded clause, the
-- finding is dropped and a row lands here. This table is the product's early
-- warning system: rows appearing here are attempted fabrications.
CREATE TABLE grounding_rejections (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id            uuid,
  submission_id        uuid,

  reason               text NOT NULL,

  -- What the model claimed, kept exactly as received for diagnosis.
  attempted_clause_ref text,
  attempted_doc_code   text,
  attempted_rule_key   text,
  attempted_text       text,
  raw_candidate        jsonb NOT NULL,

  model_name           text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX grounding_rejections_reason_idx ON grounding_rejections (reason, created_at DESC);
CREATE INDEX grounding_rejections_report_idx ON grounding_rejections (report_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER code_clauses_touch BEFORE UPDATE ON code_clauses
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER rules_touch BEFORE UPDATE ON rules
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
