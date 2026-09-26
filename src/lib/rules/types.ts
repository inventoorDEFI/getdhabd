/**
 * The rules corpus in TypeScript, mirroring db/migrations/0001_code_rules.sql.
 */

export type CodeSystem = 'SBC' | 'MOMRA' | 'MUNICIPAL' | 'FIXTURE'
export type ClauseVerification = 'unverified' | 'verified' | 'superseded' | 'rejected'
export type RuleStatus = 'draft' | 'active' | 'retired'
export type RuleSeverity = 'blocking' | 'major' | 'minor' | 'advisory'

/**
 * Whether verbatim clause text from a document may be shown to a user.
 * 'unknown' behaves exactly as 'not_permitted' everywhere.
 */
export type ReproductionRights = 'permitted' | 'not_permitted' | 'unknown'

/** The checks implemented in v1. Anything outside this list has no engine. */
export const CHECK_TYPES = [
  'setback.min',
  'height.max',
  'floors.max',
  'coverage.ratio.max',
  'parking.count.min',
  'stair.width.min',
  'stair.riser.max',
  'stair.going.min',
  'corridor.width.min',
  'door.clear_width.min',
  'egress.travel_distance.max',
  'egress.exit_count.min',
] as const

export type CheckType = (typeof CHECK_TYPES)[number]

export interface BoundingBox {
  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number
}

export interface CodeDocumentRecord {
  readonly id: string
  readonly codeSystem: CodeSystem
  readonly docCode: string
  readonly editionYear: number
  readonly titleAr: string
  readonly titleEn: string | null
  readonly sourceFileName: string
  readonly sourceSha256: string
  readonly sourceUrl: string | null
  readonly totalPages: number | null
  readonly jurisdiction: string
  readonly isFixture: boolean
  readonly reproductionRights: ReproductionRights
}

export interface CodeClauseRecord {
  readonly id: string
  readonly documentId: string
  readonly clauseNumber: string
  readonly clausePath: readonly string[]
  readonly partNumber: string | null
  readonly chapterNumber: string | null
  readonly sectionNumber: string | null
  readonly headingAr: string | null
  readonly headingEn: string | null
  /** Verbatim. This is the string the report prints. */
  readonly textAr: string
  readonly textEn: string | null
  readonly textArNormalised: string
  readonly pageNumber: number
  readonly bbox: BoundingBox | null
  readonly verificationStatus: ClauseVerification
  readonly verifiedBy: string | null
  readonly verifiedAt: Date | null
}

/**
 * A rule joined to its clause and document, as returned by v_groundable_rules.
 * There is no constructor for this type that does not carry clause text: if you
 * are holding one of these, the citation exists.
 */
export interface GroundableRule {
  readonly ruleId: string
  readonly ruleKey: string
  readonly checkType: CheckType
  readonly buildingType: string
  readonly zoneCode: string | null
  readonly jurisdiction: string
  readonly parameters: Readonly<Record<string, unknown>>
  readonly unit: string | null
  readonly severity: RuleSeverity
  readonly appliesWhen: Readonly<Record<string, unknown>>
  /** Dhabt's own restatement of the requirement. Not the clause text. */
  readonly summaryAr: string | null
  readonly summaryEn: string | null

  readonly clauseId: string
  readonly clauseNumber: string
  readonly clauseHeadingAr: string | null
  readonly clauseHeadingEn: string | null
  /**
   * Verbatim clause text, or null when the source document does not permit
   * reproduction. The view nulls this out, so a renderer cannot print text the
   * product is not licensed to show.
   */
  readonly clauseTextAr: string | null
  readonly clauseTextEn: string | null
  readonly reproductionRights: ReproductionRights
  readonly clausePageNumber: number
  readonly clauseBbox: BoundingBox | null

  readonly documentId: string
  readonly codeSystem: CodeSystem
  readonly docCode: string
  readonly editionYear: number
  readonly documentTitleAr: string
  /** Where a reader can open the source themselves. Carries the citation when text cannot. */
  readonly sourceUrl: string | null
  readonly sourceSha256: string
  readonly isFixture: boolean
}

export interface RuleScope {
  readonly buildingType: string
  readonly jurisdiction: string
  readonly zoneCode?: string | null
  /**
   * Permits rules drawn from FIXTURE documents. Development and tests only.
   * Wired to DHABT_ALLOW_FIXTURE_CODES so it cannot be switched on by accident
   * in a deployed environment.
   */
  readonly allowFixtures?: boolean
}
