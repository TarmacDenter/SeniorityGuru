// @vitest-environment node
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
      'createSeniorityAnalysis',
      'validateSeniorityAnalysisEntries',
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
      listRank: 4,
      activeRank: 3,
      listPilotCount: 5,
      activePilotCount: 4,
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

    expect(output.domain.points.map(point => ({
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

  it('preserves public validation and missing-anchor errors', () => {
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
