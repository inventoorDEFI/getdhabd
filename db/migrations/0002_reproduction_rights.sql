-- 0002_reproduction_rights.sql
--
-- Separates two things that 0001 conflated: whether a finding is GROUNDED in a
-- real clause, and whether we are LICENSED to print that clause's text.
--
-- Research of 26 Sept 2026 found that the Saudi Building Code Center reserves
-- all rights over SBC text ("no part may be reproduced, distributed or leased
-- ... without prior written permission"), and that MOMAH grants no commercial
-- reuse. Dhabt's report printed verbatim clause text unconditionally, so it
-- would have shipped unlicensed content.
--
-- The fix keeps the safety property and drops the liability:
--   - text_ar stays NOT NULL. It is still transcribed and still verified, because
--     a human comparing text to the source page is what makes a clause real, and
--     because an edition diff needs it. It becomes INTERNAL data.
--   - rules gain summary_ar: Dhabt's own restatement of the requirement.
--   - code_documents gain reproduction_rights. Only a document explicitly marked
--     'permitted' may have its verbatim text leave the system.
--
-- A numeric limit is a fact, and facts are not copyrightable. A restatement in
-- our own words plus a section number plus a link is the lower-risk pattern the
-- research recommends, and it is what the report now shows by default.

CREATE TYPE reproduction_rights AS ENUM (
  'permitted',      -- written permission on file, recorded in rights_note
  'not_permitted',  -- rights holder reserves reproduction; cite and restate only
  'unknown'         -- not yet established. Treated exactly as not_permitted.
);

ALTER TABLE code_documents
  ADD COLUMN reproduction_rights reproduction_rights NOT NULL DEFAULT 'unknown',
  -- Who granted it, when, and the scope. Required when rights are 'permitted',
  -- for the same reason clause verification requires a named verifier.
  ADD COLUMN rights_note text,
  ADD COLUMN rights_confirmed_by text,
  ADD COLUMN rights_confirmed_at timestamptz,
  ADD CONSTRAINT rights_permitted_needs_evidence CHECK (
    reproduction_rights <> 'permitted'
    OR (rights_confirmed_by IS NOT NULL
        AND btrim(rights_confirmed_by) <> ''
        AND rights_confirmed_at IS NOT NULL
        AND rights_note IS NOT NULL)
  );

COMMENT ON COLUMN code_documents.reproduction_rights IS
  'Whether verbatim clause text from this document may be shown to a user. Default unknown, which behaves as not_permitted.';

-- Dhabt's own words for the requirement. Not the clause text.
ALTER TABLE rules
  ADD COLUMN summary_ar text,
  ADD COLUMN summary_en text;

COMMENT ON COLUMN rules.summary_ar IS
  'Dhabt''s restatement of the requirement, written by the rule author. Shown in place of clause text when reproduction is not permitted. Must state the numeric limit, which is a fact and not protected expression.';

-- A rule cannot go active without something publishable to show. Either we may
-- print the clause, or we have written our own restatement. Without this an
-- unlicensed rule would render an empty citation body.
CREATE OR REPLACE FUNCTION assert_active_rule_is_publishable()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  rights reproduction_rights;
  clause_ref text;
BEGIN
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  SELECT d.reproduction_rights, c.clause_number
    INTO rights, clause_ref
    FROM code_clauses c
    JOIN code_documents d ON d.id = c.document_id
   WHERE c.id = NEW.clause_id;

  IF rights <> 'permitted'
     AND (NEW.summary_ar IS NULL OR btrim(NEW.summary_ar) = '') THEN
    RAISE EXCEPTION
      'rule % cannot be active: clause % comes from a document whose reproduction rights are %, so the report cannot print its text, and no summary_ar was written to show instead',
      NEW.rule_key, clause_ref, rights
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER rules_require_publishable_body
  BEFORE INSERT OR UPDATE OF status, clause_id, summary_ar ON rules
  FOR EACH ROW EXECUTE FUNCTION assert_active_rule_is_publishable();

-- The engine's view now carries the rights decision, so the renderer never has
-- to ask a second question or join a second table to find out what it may show.
DROP VIEW v_groundable_rules;

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
  r.summary_ar,
  r.summary_en,
  c.id            AS clause_id,
  c.clause_number,
  c.clause_path,
  c.heading_ar,
  c.heading_en,
  -- Verbatim text is exposed ONLY when the rights holder permits it. This is the
  -- structural half of the guarantee: the renderer cannot print what the view
  -- does not return, however the renderer is later rewritten.
  CASE WHEN d.reproduction_rights = 'permitted' THEN c.text_ar ELSE NULL END
                  AS clause_text_ar,
  CASE WHEN d.reproduction_rights = 'permitted' THEN c.text_en ELSE NULL END
                  AS clause_text_en,
  d.reproduction_rights,
  c.page_number,
  c.bbox,
  d.id            AS document_id,
  d.code_system,
  d.doc_code,
  d.edition_year,
  d.title_ar      AS document_title_ar,
  d.source_url,
  d.source_sha256,
  d.is_fixture
FROM rules r
JOIN code_clauses   c ON c.id = r.clause_id
JOIN code_documents d ON d.id = c.document_id
WHERE r.status = 'active'
  AND c.verification_status = 'verified';

COMMENT ON VIEW v_groundable_rules IS
  'Active rules with a verified clause. clause_text_ar is NULL unless the source document permits reproduction; use summary_ar in that case.';
