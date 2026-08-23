// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { makeDomainEntry as makeEntry } from '~/test-utils/factories'
import {
  AnchorNotFoundError,
  createSeniorityLens,
  createSeniorityScenario,
  createSenioritySnapshot,
  type AnchoredSeniorityLens,
  type SeniorityLens,
} from '~/utils/seniority'
import { Temporal } from '~/utils/temporal'

const asOfDate = Temporal.PlainDate.from('2026-06-15')
const through = Temporal.PlainDate.from('2050-06-15')

const entries = [
  makeEntry({ seniority_number: 100, employee_number: 'E100', base: 'JFK', seat: 'CA', fleet: '737', hire_date: '2000-01-01', retire_date: '2025-06-01' }),
  makeEntry({ seniority_number: 105, employee_number: 'E105', base: 'JFK', seat: 'CA', fleet: '737', hire_date: '2005-01-01', retire_date: '2026-12-01' }),
  makeEntry({ seniority_number: 110, employee_number: 'E110', base: 'ATL', seat: 'FO', fleet: '320', hire_date: '2010-01-01', retire_date: '2040-01-01' }),
  makeEntry({ seniority_number: 125, employee_number: 'E125', base: 'JFK', seat: 'CA', fleet: '737', hire_date: '2015-01-01', retire_date: '2045-01-01' }),
  makeEntry({ seniority_number: 140, employee_number: 'E140', base: 'ATL', seat: 'FO', fleet: '320', hire_date: '2020-01-01', retire_date: '2050-01-01' }),
]

const snapshot = createSenioritySnapshot(entries)
const createOrganizationLens = () => createSeniorityLens(snapshot, { asOfDate })

function assertOrganizationLensCapabilities(lens: SeniorityLens) {
  lens.retirementsNext12Months()
  lens.retirementCountProjection({ through })

  // @ts-expect-error Pilot-relative analysis requires an AnchoredSeniorityLens.
  lens.seniorityStanding()
  // @ts-expect-error Pilot-relative analysis requires an AnchoredSeniorityLens.
  lens.seniorityTrajectory({ through })
  // @ts-expect-error Pilot-relative analysis requires an AnchoredSeniorityLens.
  void lens.anchor
}

function assertAnchoredLensCapabilities(lens: AnchoredSeniorityLens) {
  lens.retirementsNext12Months()
  lens.retirementCountProjection({ through })
  lens.seniorityStanding()
  lens.seniorityTrajectory({ through })

  // @ts-expect-error Old nullable pilot-relative vocabulary is not supported.
  lens.standing()
  // @ts-expect-error Qualification positions replace the staged Qualification scale API.
  lens.qualScales()
}

void assertOrganizationLensCapabilities
void assertAnchoredLensCapabilities

describe('SeniorityLens capability seam', () => {
  it('keeps pilot-relative capabilities off the organization lens', () => {
    const lens = createOrganizationLens()

    expect(lens.snapshot).toBe(snapshot)
    expect(lens.retirementsNext12Months()).toBe(1)
    expect(lens).not.toHaveProperty('anchor')
    expect(lens).not.toHaveProperty('seniorityStanding')
    expect(lens).not.toHaveProperty('seniorityTrajectory')
  })

  it('derives the canonical anchor through normalized employee identity', () => {
    const numericEntry = makeEntry({ seniority_number: 500, employee_number: '00123' })
    const lens = createSeniorityLens(createSenioritySnapshot([numericEntry]), { asOfDate })

    expect(lens.withAnchor('00123').anchor).toBe(numericEntry)
    expect(lens.withAnchor('123').anchor).toBe(numericEntry)
    expect(lens.withAnchor('000123').anchor).toBe(numericEntry)
  })

  it('throws AnchorNotFoundError without changing organization analysis', () => {
    const lens = createOrganizationLens()
    const before = lens.retirementYearAnalysis()

    expect(() => lens.withAnchor('missing')).toThrow(AnchorNotFoundError)
    expect(lens.retirementYearAnalysis()).toBe(before)
  })

  it('shares the snapshot and organization memoization without sharing anchored memoization', () => {
    const lens = createOrganizationLens()
    const first = lens.withAnchor('E125')
    const second = lens.withAnchor('E125')
    const other = lens.withAnchor('E110')
    const scenario = createSeniorityScenario({ qualificationScope: { seat: 'CA' } })

    expect(first.snapshot).toBe(lens.snapshot)
    expect(other.snapshot).toBe(lens.snapshot)
    expect(first.retirementYearAnalysis(scenario)).toBe(lens.retirementYearAnalysis(scenario))
    expect(other.retirementYearAnalysis(scenario)).toBe(lens.retirementYearAnalysis(scenario))
    expect(first.seniorityStanding()).toBe(first.seniorityStanding())
    expect(first.seniorityStanding()).not.toBe(second.seniorityStanding())
    expect(first.seniorityStanding()).not.toEqual(other.seniorityStanding())
  })
})

describe('organization analysis', () => {
  it('returns retirement projections as dated domain buckets', () => {
    const result = createOrganizationLens().retirementCountProjection({
      through: Temporal.PlainDate.from('2028-06-15'),
      scenario: createSeniorityScenario({ qualificationScope: { seat: 'CA' } }),
    })

    expect(result.scopedPilotCount).toBe(3)
    expect(result.buckets.map(bucket => ({
      through: bucket.through.toString(),
      retirementCount: bucket.retirementCount,
    }))).toEqual([
      { through: '2026-06-15', retirementCount: 0 },
      { through: '2027-06-15', retirementCount: 1 },
      { through: '2028-06-15', retirementCount: 0 },
    ])
    expect(result).not.toHaveProperty('labels')
    expect(result).not.toHaveProperty('data')
  })

  it('uses an explicit inclusive through date and Qualification Scope for upcoming retirements', () => {
    const rows = createOrganizationLens().upcomingRetirements({
      through: Temporal.PlainDate.from('2045-01-01'),
      qualificationScope: { base: 'JFK', seat: 'CA', fleet: '737' },
    })

    expect(rows.map(row => ({ employeeNumber: row.employeeNumber, retirementDate: row.retirementDate.toString() }))).toEqual([
      { employeeNumber: 'E105', retirementDate: '2026-12-01' },
      { employeeNumber: 'E125', retirementDate: '2045-01-01' },
    ])
    expect(rows[0]?.qualification).toEqual({ base: 'JFK', seat: 'CA', fleet: '737' })
    expect(rows[0]).not.toHaveProperty('positionsSeniorToAnchor')
  })

  it('returns numeric demographic and retirement-year domain values', () => {
    const lens = createOrganizationLens()
    const scenario = createSeniorityScenario({ qualificationScope: { seat: 'CA' } })
    const demographics = lens.demographics({ mandatoryRetirementAge: 65, scenario })

    expect(demographics.ageDistribution.buckets[0]).toEqual({ minimumAge: 0, maximumAge: 29, pilotCount: 0 })
    expect(demographics.ageDistribution.buckets[0]).not.toHaveProperty('label')
    expect(demographics.yearsOfServiceBuckets[0]).not.toHaveProperty('label')
    expect(demographics.captainQualificationThresholds[0]?.qualification).toEqual(expect.objectContaining({ seat: 'CA' }))
    expect(lens.retirementYearAnalysis(scenario)).toEqual([
      { year: 2025, retirementCount: 1, isRetirementWave: false },
      { year: 2026, retirementCount: 1, isRetirementWave: false },
      { year: 2045, retirementCount: 1, isRetirementWave: false },
    ])
  })
})

describe('anchored analysis', () => {
  const anchored = createOrganizationLens().withAnchor('E125')

  it('distinguishes Seniority Number, list Rank, and active Rank when numbers have gaps', () => {
    const standing = anchored.seniorityStanding()

    expect(anchored.anchor.seniority_number).toBe(125)
    expect(standing).toMatchObject({
      listRank: 4,
      activeRank: 3,
      listPilotCount: 5,
      activePilotCount: 4,
      listPercentile: 40,
      activePercentile: 50,
      retiredPilotsSeniorToAnchor: 1,
      rollingNext12MonthRetirements: 1,
      rollingNext12MonthRetirementsSeniorToAnchor: 1,
    })
    expect(standing.qualificationStandings).toContainEqual({
      qualification: { base: 'JFK', seat: 'CA', fleet: '737' },
      listRank: 3,
      activeRank: 2,
      listPilotCount: 3,
      activePilotCount: 2,
      listPercentile: 33.3,
      activePercentile: 50,
      isAnchorCurrentQualification: true,
    })
  })

  it('returns trajectories and comparisons without chart-shaped values', () => {
    const scenario = createSeniorityScenario({ qualificationScope: { seat: 'CA' } })
    const trajectory = anchored.seniorityTrajectory({
      through: Temporal.PlainDate.from('2028-01-01'),
      scenario,
    })
    const comparison = anchored.seniorityTrajectoryComparison({
      through: Temporal.PlainDate.from('2028-01-01'),
      baselineScenario: scenario,
      comparisonScenario: createSeniorityScenario(),
    })

    expect(trajectory.points.map(point => point.date.toString())).toEqual(['2026-06-15', '2027-06-15'])
    expect(trajectory).not.toHaveProperty('chartData')
    expect(trajectory.changes[0]).toHaveProperty('percentilePointChange')
    expect(trajectory.changes[0]).not.toHaveProperty('isPeak')
    expect(comparison.points[0]).toEqual(expect.objectContaining({
      date: asOfDate,
      baselinePercentile: expect.any(Number),
      comparisonPercentile: expect.any(Number),
    }))
    expect(comparison).not.toHaveProperty('labels')
  })

  it('returns a numeric percentile crossing year', () => {
    const result = anchored.percentileCrossing({
      targetPercentile: 90,
      through,
      scenario: createSeniorityScenario({ qualificationScope: { seat: 'CA' } }),
    })

    expect(result).toEqual({ crossingYear: 2027 })
  })

  it('returns Qualification Positions through one anchored operation', () => {
    const positions = anchored.qualificationPositions({
      through: Temporal.PlainDate.from('2030-06-15'),
      growthAssumptions: { enabled: true, annualGrowthRate: 0.03 },
    })

    expect(positions[0]).toEqual(expect.objectContaining({
      distribution: expect.objectContaining({
        qualification: expect.objectContaining({ base: expect.any(String), seat: expect.any(String), fleet: expect.any(String) }),
        activePilotCount: expect.any(Number),
        thresholdPercentile: expect.any(Number),
        thresholdSeniorityNumber: expect.any(Number),
        percentileDensity: expect.any(Array),
      }),
      currentPercentile: expect.any(Number),
      projectedPercentile: expect.any(Number),
      modeledHoldable: expect.any(Boolean),
    }))
  })

  it('calculates relative retirement positions from company-list Rank', () => {
    const all = anchored.relativeUpcomingRetirements({ through, seniorOnly: false })
    const senior = anchored.relativeUpcomingRetirements({ through, seniorOnly: true })

    expect(all.find(row => row.employeeNumber === 'E105')?.positionsSeniorToAnchor).toBe(2)
    expect(all.find(row => row.employeeNumber === 'E125')?.positionsSeniorToAnchor).toBe(0)
    expect(all.find(row => row.employeeNumber === 'E140')?.positionsSeniorToAnchor).toBe(-1)
    expect(senior.map(row => row.employeeNumber)).toEqual(['E105', 'E110'])
  })
})
