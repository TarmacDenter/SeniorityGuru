// @vitest-environment node
import { resultOf } from '~/test-utils/no-result'
import { describe, expect, it } from 'vitest'
import { makeDomainEntry as makeEntry } from '~/test-utils/factories'
import { Temporal } from '~/utils/temporal'
import * as seniority from './seniority'
import type { SeniorityAnalysis } from './seniority'

const asOfDate = Temporal.PlainDate.from('2026-06-15')

const entries = [
  makeEntry({ seniority_number: 100, employee_number: 'E100', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2025-06-01' }),
  makeEntry({ seniority_number: 105, employee_number: 'E105', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2026-12-01' }),
  makeEntry({ seniority_number: 110, employee_number: 'E110', base: 'ATL', seat: 'FO', fleet: '320', retire_date: '2040-01-01' }),
  makeEntry({ seniority_number: 125, employee_number: '00125', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2045-01-01' }),
  makeEntry({ seniority_number: 140, employee_number: 'E140', base: 'ATL', seat: 'FO', fleet: '320', retire_date: '2050-01-01' }),
]

const createAnalysis = () => seniority.createSeniorityAnalysis({ entries, asOfDate })

function assertPublicCapabilityAndReadonlyTypes(organization: SeniorityAnalysis) {
  const projection = organization.retirementCountProjection({
    through: Temporal.PlainDate.from('2028-06-15'),
  })

  // @ts-expect-error Pilot-relative analysis requires an anchored Seniority Analysis.
  organization.seniorityStanding()
  // @ts-expect-error Pilot-relative analysis requires an anchored Seniority Analysis.
  void organization.anchor
  // @ts-expect-error Seniority outputs are readonly values.
  projection.domain = {} as typeof projection.domain
  // @ts-expect-error Domain bucket collections are readonly.
  projection.domain.buckets.push(projection.domain.buckets[0]!)

  const anchored = organization.withAnchor('125')
  // @ts-expect-error The canonical Anchor Pilot is readonly.
  anchored.anchor.employee_number = 'different'
}

void assertPublicCapabilityAndReadonlyTypes

describe('public Seniority Analysis interface', () => {
  it('exports only the supported runtime seam', () => {
    expect(Object.keys(seniority).sort()).toEqual([
      'AnchorNotFoundError',
      'DEFAULT_SENIORITY_GROWTH_ASSUMPTIONS',
      'InvalidSenioritySnapshotDataError',
      'formatGrowthAssumptions',
      'isNoResult',
      'resultOrNull',
      'createSeniorityAnalysis',
    ].sort())
  })

  it('does not expose math, engine construction, presentation, or internal helpers', () => {
    const hiddenNames = [
      'calculateSeniorityRank',
      'calculateSeniorityPercentile',
      'calculateSeniorityTrajectory',
      'createSenioritySnapshot',
      'createSeniorityLens',
      'createSeniorityScenario',
      'enumerateQualificationScopes',
      'formatQualificationScope',
      'presentSeniorityTrajectory',
      'analyzeAgeDistribution',
      'memoizeLast',
      'qualificationKey',
    ]

    for (const name of hiddenNames) expect(seniority).not.toHaveProperty(name)
  })

  it('returns completed domain and presentation values through one organization operation', () => {
    const output = createAnalysis().retirementCountProjection({
      through: Temporal.PlainDate.from('2028-06-15'),
      scenario: { qualificationScope: { seat: 'CA' } },
    })

    expect(output.domain.scopedPilotCount).toBe(3)
    expect(output.domain.buckets.map(bucket => ({
      through: bucket.through.toString(),
      retirementCount: bucket.retirementCount,
    }))).toEqual([
      { through: '2026-06-15', retirementCount: 0 },
      { through: '2027-06-15', retirementCount: 1 },
      { through: '2028-06-15', retirementCount: 0 },
    ])
    expect(output.presentation).toEqual({
      labels: ['Jun 2026', 'Jun 2027', 'Jun 2028'],
      data: [0, 1, 0],
      scopedPilotCount: 3,
    })
    expect(output.domain).not.toHaveProperty('labels')
  })

  it('derives anchored capabilities through normalized employee identity', () => {
    const organization = createAnalysis()
    const anchored = organization.withAnchor('125')

    expect(anchored.anchor).toBe(entries[3])
    expect(anchored.seniorityStanding().domain).toMatchObject({
      rank: 3,
      publicationPosition: 4,
      rosterSize: 5,
      activePilotCount: 4,
      seniorityPercentile: 60,
    })
    expect(organization).not.toHaveProperty('anchor')
    expect(organization).not.toHaveProperty('seniorityStanding')
  })

  it('keeps baseline and comparison Growth Assumptions independent', () => {
    const output = createAnalysis().withAnchor('125').seniorityTrajectoryComparison({
      through: Temporal.PlainDate.from('2027-06-15'),
      baselineScenario: {
        growthAssumptions: { enabled: false, annualGrowthRate: 1 },
      },
      comparisonScenario: {
        growthAssumptions: { enabled: true, annualGrowthRate: 1 },
      },
    })

    expect(resultOf(output.domain).points.map(point => ({
      baseline: point.baselinePercentile,
      comparison: point.comparisonPercentile,
    }))).toEqual([
      { baseline: 60, comparison: 60 },
      { baseline: 80, comparison: 90 },
    ])
    expect(output.presentation).toEqual({
      labels: ['2026-06-15', '2027-06-15'],
      baselineData: [60, 80],
      comparisonData: [60, 90],
      endedByLabel: null,
      baselineHypotheticalLabel: null,
      comparisonHypotheticalLabel: null,
    })
  })

  it('returns ordered Qualification Scope choices with presentation labels', () => {
    const options = createAnalysis().catalog.qualificationScopeOptions

    expect(options[0]).toEqual({ scope: {}, label: 'Company-wide' })
    expect(options).toContainEqual({
      scope: { base: 'JFK', seat: 'CA', fleet: '737' },
      label: 'JFK CA 737',
    })
  })

  it('returns Qualification viewer domain and presentation values through the bound analysis', () => {
    const output = createAnalysis().qualificationViewer({ employeeNumber: '125' })

    expect(output.domain.anchorFound).toBe(true)
    expect(output.presentation.entries.find(entry => entry.isAnchor)).toMatchObject({
      employeeNumber: '00125',
      retirementTimeline: null,
    })
  })

  it('preserves public missing-anchor and snapshot errors', () => {
    const duplicateIdentityEntries = [
      makeEntry({ seniority_number: 1, employee_number: '00125' }),
      makeEntry({ seniority_number: 2, employee_number: '125' }),
    ]

    expect(() => seniority.createSeniorityAnalysis({
      entries: duplicateIdentityEntries,
      asOfDate,
    })).toThrow(seniority.InvalidSenioritySnapshotDataError)
    expect(() => createAnalysis().withAnchor('missing')).toThrow(seniority.AnchorNotFoundError)
  })
})

describe('publication pilot count', () => {
  const modeled = makeEntry({ seniority_number: 141, employee_number: '_new_hire', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2060-01-01' })

  it('equals the list size for a real Anchor Pilot with no scope', () => {
    const standing = resultOf(createAnalysis().withAnchor('125').seniorityStanding().domain)
    expect(standing.publicationPilotCount).toBe(5)
    expect(standing.rosterSize).toBe(5)
  })

  it('counts only real pilots in the scope', () => {
    const output = createAnalysis().withAnchor('125').seniorityStanding({ scenario: { qualificationScope: { base: 'ATL' } } })
    const standing = resultOf(output.domain)
    // Real Anchor Pilot is outside ATL: Roster Size counts it as modeled, the publication count does not.
    expect(standing.rosterSize).toBe(3)
    expect(standing.publicationPilotCount).toBe(2)
    expect(resultOf(output.presentation).publicationPilotCount).toBe(2)
  })

  it('excludes the modeled New Hire pilot from the publication count but includes it in Roster Size', () => {
    const analysis = seniority.createSeniorityAnalysis({ entries, modeledEntry: modeled, asOfDate })
    const standing = resultOf(analysis.withAnchor('_new_hire').seniorityStanding().domain)
    expect(standing.rosterSize).toBe(6)
    expect(standing.publicationPilotCount).toBe(5)
  })

  it('counts real pilots in the scope when the modeled pilot is scoped', () => {
    const analysis = seniority.createSeniorityAnalysis({ entries, modeledEntry: modeled, asOfDate })
    const anchored = analysis.withAnchor('_new_hire')

    const jfk = resultOf(anchored.seniorityStanding({ scenario: { qualificationScope: { base: 'JFK' } } }).domain)
    expect(jfk).toMatchObject({ rosterSize: 4, publicationPilotCount: 3 })

    const lax = resultOf(anchored.seniorityStanding({ scenario: { qualificationScope: { base: 'LAX' } } }).domain)
    expect(lax).toMatchObject({ rosterSize: 1, publicationPilotCount: 0 })
  })

  it('does not change any percentile', () => {
    const withModeled = seniority.createSeniorityAnalysis({ entries, modeledEntry: modeled, asOfDate })
    const merged = seniority.createSeniorityAnalysis({ entries: [...entries, modeled], asOfDate })
    expect(withModeled.withAnchor('_new_hire').seniorityStanding().domain)
      .toMatchObject({ seniorityPercentile: resultOf(merged.withAnchor('_new_hire').seniorityStanding().domain).seniorityPercentile })
  })
})

describe('presented Standing labels', () => {
  const modeled = makeEntry({ seniority_number: 141, employee_number: '_new_hire', base: 'JFK', seat: 'CA', fleet: '737', retire_date: '2060-01-01' })

  it('labels Roster Size plainly for a real Anchor Pilot in scope', () => {
    const output = createAnalysis().withAnchor('125').seniorityStanding()
    const presentation = resultOf(output.presentation)

    expect(resultOf(output.domain).isModeled).toBe(false)
    expect(presentation.rosterSizeLabel).toBe('Roster Size')
    expect(presentation.rosterSizeTrend).toBeNull()
    expect(presentation.retirementsSeniorToAnchorLabel).toBe('1 senior to you')
  })

  it('labels a modeled New Hire pilot with the real publication count', () => {
    const analysis = seniority.createSeniorityAnalysis({ entries, modeledEntry: modeled, asOfDate })
    const output = analysis.withAnchor('_new_hire').seniorityStanding()
    const presentation = resultOf(output.presentation)

    expect(resultOf(output.domain).isModeled).toBe(true)
    expect(presentation.rosterSizeLabel).toBe('Roster Size (modeled)')
    expect(presentation.rosterSizeTrend).toBe('5 in publication')
  })

  it('labels a modeled pilot placed hypothetically in a scope', () => {
    const analysis = seniority.createSeniorityAnalysis({ entries, modeledEntry: modeled, asOfDate })
    const presentation = resultOf(analysis.withAnchor('_new_hire')
      .seniorityStanding({ scenario: { qualificationScope: { base: 'ATL' } } }).presentation)

    expect(presentation.rosterSizeLabel).toBe('Roster Size (modeled, hypothetical)')
    expect(presentation.rosterSizeTrend).toBe('2 in publication · includes you')
  })

  it('labels a hypothetical real pilot', () => {
    const presentation = resultOf(createAnalysis().withAnchor('125')
      .seniorityStanding({ scenario: { qualificationScope: { base: 'ATL' } } }).presentation)

    expect(presentation.rosterSizeLabel).toBe('Roster Size (hypothetical)')
    expect(presentation.rosterSizeTrend).toBe('includes you')
  })
})

describe('Standing for a scope with no real pilots', () => {
  it('reports a publication count of zero and places the Anchor Pilot hypothetically', () => {
    const output = createAnalysis().withAnchor('125').seniorityStanding({ scenario: { qualificationScope: { base: 'LAX' } } })
    const standing = resultOf(output.domain)

    expect(standing).toMatchObject({ publicationPilotCount: 0, rosterSize: 1, rank: 1, isHypothetical: true })
    expect(resultOf(output.presentation).hypotheticalLabel).toBe('Hypothetical Placement in LAX')
  })
})

describe('Standing retirement counts by scope', () => {
  const standingFor = (qualificationScope = {}) =>
    resultOf(createAnalysis().withAnchor('125').seniorityStanding({ scenario: { qualificationScope } }).domain)

  it('equals the company-wide values with no scope', () => {
    const standing = standingFor()

    expect(standing.rollingNext12MonthRetirements).toBe(createAnalysis().retirementsNext12Months())
    expect(standing).toMatchObject({ rollingNext12MonthRetirements: 1, rollingNext12MonthRetirementsSeniorToAnchor: 1 })
  })

  it('narrows both counts to the scope', () => {
    expect(standingFor({ base: 'JFK' })).toMatchObject({ rollingNext12MonthRetirements: 1, rollingNext12MonthRetirementsSeniorToAnchor: 1 })
    expect(standingFor({ base: 'ATL' })).toMatchObject({ rollingNext12MonthRetirements: 0, rollingNext12MonthRetirementsSeniorToAnchor: 0 })
  })
})

describe('presented Standing display values', () => {
  it('formats Roster Size, summaries, and each Qualification Rank as pilot-readable text', () => {
    const presentation = resultOf(createAnalysis().withAnchor('125').seniorityStanding().presentation)
    const own = presentation.qualificationStandings.find(row => row.isAnchorCurrentQualification)!

    expect(presentation.rosterSizeValueLabel).toBe('5')
    expect(presentation.rosterSummaryLabel).toBe('Roster Size 5 · Active pilots 4')
    expect(presentation.percentileScaleLabel).toBe('Percentile measured against Roster Size 5 · Active pilots 4')
    expect(own.rankLabel).toBe('2')
  })

  it('follows the scope in the summaries', () => {
    const presentation = resultOf(createAnalysis().withAnchor('125')
      .seniorityStanding({ scenario: { qualificationScope: { base: 'ATL' } } }).presentation)

    expect(presentation.rosterSummaryLabel).toBe('Roster Size 3 · Active pilots 3')
  })
})


describe('completed trajectory dashboard values', () => {
  it('selects the first best year and aligns percentiles with all retirement years', () => {
    const output = createAnalysis().withAnchor('125').seniorityTrajectory({ through: Temporal.PlainDate.from('2045-01-01') })
    const presented = resultOf(output.presentation)
    expect(presented.bestYearLabel).toBe('Best year: 2027 (+20.0pp)')
    expect(presented.retirementWave).toEqual({
      buckets: [
        { year: 2025, retirementCount: 1, isRetirementWave: false },
        { year: 2026, retirementCount: 1, isRetirementWave: false },
        { year: 2040, retirementCount: 1, isRetirementWave: false },
        { year: 2045, retirementCount: 1, isRetirementWave: false },
        { year: 2050, retirementCount: 1, isRetirementWave: false },
      ],
      percentileSeries: [null, 60, 100, null, null],
    })
  })
})


describe('completed demographics values', () => {
  it('returns matching counts, sorted formatted sizes and As-of Date years of service', () => {
    const analysis = seniority.createSeniorityAnalysis({
      entries: entries.map(entry => ({ ...entry, hire_date: Temporal.PlainDate.from('2010-06-15') })), asOfDate,
    })
    const output = analysis.withAnchor('125').demographics({ mandatoryRetirementAge: 65, scenario: { qualificationScope: { seat: 'CA' } } })
    expect(output.domain.matchingPilotCount).toBe(3)
    expect(output.domain.anchorYearsOfService).toBe(16)
    expect(output.presentation).toMatchObject({
      matchingPilotCount: 3,
      anchorYearsOfService: 16,
      hasYearsOfService: true,
      qualificationSizes: [{ fleet: '737', seat: 'CA', base: 'JFK', countLabel: '3' }],
    })
    expect(analysis.demographics({ mandatoryRetirementAge: 65 }).presentation.anchorYearsOfService).toBeUndefined()
  })
})


describe('completed senior retirement readout', () => {
  it('counts senior scoped retirements and supplies singular and plural window wording', () => {
    const analysis = createAnalysis().withAnchor('125')
    const oneYear = analysis.retirementCountProjection({ through: asOfDate.add({ years: 1 }) })
    expect(oneYear.domain.seniorRetirementCount).toBe(1)
    expect(oneYear.presentation.seniorRetirementLabel).toBe('1 retirement senior to you in the next year')
    const scoped = analysis.retirementCountProjection({ through: asOfDate.add({ years: 5 }), scenario: { qualificationScope: { base: 'ATL' } } })
    expect(scoped.presentation.seniorRetirementCount).toBe(0)
    expect(scoped.presentation.seniorRetirementLabel).toBe('0 retirements senior to you in the next 5 years')
  })
})


describe('senior retirement window boundaries', () => {
  it('excludes retirements on the As-of Date and includes the Projection Through Date', () => {
    const analysis = seniority.createSeniorityAnalysis({ asOfDate, entries: [
      makeEntry({ seniority_number: 1, employee_number: 'start', retire_date: '2026-06-15' }),
      makeEntry({ seniority_number: 2, employee_number: 'through', retire_date: '2027-06-15' }),
      makeEntry({ seniority_number: 3, employee_number: 'after', retire_date: '2027-06-16' }),
      makeEntry({ seniority_number: 4, employee_number: 'anchor', retire_date: '2040-01-01' }),
    ] }).withAnchor('anchor')
    expect(analysis.retirementCountProjection({ through: asOfDate.add({ years: 1 }) }).presentation)
      .toMatchObject({ seniorRetirementCount: 1, seniorRetirementLabel: '1 retirement senior to you in the next year' })
  })
})

describe('completed Holdability and retirement catalog values', () => {
  it('provides seat summary wording for owned and hypothetical Qualifications', () => {
    const presented = resultOf(createAnalysis().withAnchor('125').seniorityStanding().presentation)
    expect(presented.holdabilitySummaryBySeat).toEqual({ CA: null, FO: 'Hypothetical Placement in all First Officer Qualifications' })
    const withAnotherCaptain = seniority.createSeniorityAnalysis({ entries: [...entries,
      makeEntry({ seniority_number: 150, employee_number: 'E150', base: 'LAX', seat: 'CA', fleet: '737' }),
    ], asOfDate })
    expect(resultOf(withAnotherCaptain.withAnchor('125').seniorityStanding().presentation).holdabilitySummaryBySeat.CA)
      .toBe('Hypothetical Placement in the other Captain Qualifications')
  })

  it('shares the latest scheduled retirement, including past dates, and keeps the empty fallback', () => {
    expect(createAnalysis().catalog.latestRetirementDate?.toString()).toBe('2050-01-01')
    expect(seniority.createSeniorityAnalysis({ entries: [], asOfDate }).catalog.latestRetirementDate).toBeNull()
    expect(seniority.createSeniorityAnalysis({ entries: [entries[0]!], asOfDate }).catalog.latestRetirementDate?.toString()).toBe('2025-06-01')
  })
})


describe('unimproving trajectory caption', () => {
  it('has no best year for an active Anchor Pilot whose percentile never improves', () => {
    const analysis = seniority.createSeniorityAnalysis({ asOfDate, entries: [
      makeEntry({ seniority_number: 1, employee_number: 'anchor', retire_date: '2040-01-01' }),
    ] }).withAnchor('anchor')
    const output = analysis.seniorityTrajectory({ through: Temporal.PlainDate.from('2030-01-01') })
    expect(resultOf(output.presentation).bestYearLabel).toBeNull()
  })
})


describe('Qualification projection horizon fallback', () => {
  it('keeps the As-of Date sample when the undated Anchor Pilot outlasts all scheduled retirements', () => {
    const qualification = { base: 'JFK', seat: 'CA', fleet: '737' }
    const analysis = seniority.createSeniorityAnalysis({ asOfDate, entries: [
      makeEntry({ seniority_number: 1, employee_number: 'retired', ...qualification, retire_date: '2025-01-01' }),
      makeEntry({ seniority_number: 2, employee_number: 'anchor', ...qualification, retire_date: undefined }),
    ] }).withAnchor('anchor')
    const detail = resultOf(analysis.holdabilityDetail({ qualification }).presentation)
    expect(detail?.labels).toEqual(['2026-06-15'])
    expect(detail?.anchorSeries).toEqual([100])
  })
})
