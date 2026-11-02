// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { resultOf } from '~/test-utils/no-result'
import { makeDomainEntry as makeEntry } from '~/test-utils/factories'
import { Temporal } from '~/utils/temporal'
import { createSeniorityAnalysis, isNoResult, type QualificationScope } from './seniority'

const asOfDate = Temporal.PlainDate.from('2026-06-15')
const through = Temporal.PlainDate.from('2030-06-15')

const bos = { base: 'BOS', seat: 'CA', fleet: '220' }
const roster = [
  makeEntry({ seniority_number: 10, employee_number: 'B1', ...bos, retire_date: '2025-06-01' }),
  makeEntry({ seniority_number: 20, employee_number: 'B2', ...bos, retire_date: '2028-01-01' }),
  makeEntry({ seniority_number: 30, employee_number: 'B3', ...bos, retire_date: '2050-01-01' }),
  makeEntry({ seniority_number: 40, employee_number: 'B4', ...bos, retire_date: '2050-01-01' }),
  makeEntry({ seniority_number: 15, employee_number: 'C1', base: 'ORD', seat: 'CA', fleet: '737', retire_date: '2050-01-01' }),
]

function anchorX(overrides: Partial<Parameters<typeof makeEntry>[0]> = {}) {
  return makeEntry({
    seniority_number: 25,
    employee_number: 'X',
    base: 'JFK',
    seat: 'FO',
    fleet: '320',
    retire_date: '2050-01-01',
    ...overrides,
  })
}

function anchored(anchor = anchorX(), asOf = asOfDate) {
  return createSeniorityAnalysis({ entries: [...roster, anchor], asOfDate: asOf }).withAnchor(anchor.employee_number)
}

const bosScope: QualificationScope = { base: 'BOS' }
const fullBosScope: QualificationScope = bos

describe('Hypothetical Placement: Anchor Pilot outside the Qualification Scope', () => {
  it('places the Anchor Pilot by Seniority Number among the scope pilots', () => {
    const standing = resultOf(anchored().seniorityStanding({ scenario: { qualificationScope: bosScope } }).domain)

    expect(standing).toMatchObject({
      publicationPosition: 3,
      rank: 2,
      rosterSize: 5,
      activePilotCount: 4,
      seniorityPercentile: 80,
      isHypothetical: true,
    })
  })

  it('labels the presented Standing with the scope', () => {
    const presentation = resultOf(
      anchored().seniorityStanding({ scenario: { qualificationScope: fullBosScope } }).presentation,
    )
    expect(presentation.hypotheticalLabel).toBe('Hypothetical Placement in BOS CA 220')
  })

  it('is not hypothetical inside the scope, company-wide, or with an empty scope', () => {
    const own = { base: 'JFK', seat: 'FO', fleet: '320' }
    for (const scope of [own, {}, { seat: 'FO' }]) {
      const output = anchored().seniorityStanding({ scenario: { qualificationScope: scope } })
      expect(resultOf(output.domain).isHypothetical).toBe(false)
      expect(resultOf(output.presentation).hypotheticalLabel).toBeNull()
    }
  })

  it('projects a trajectory with the Anchor Pilot counted in the scope', () => {
    const output = anchored().seniorityTrajectory({ through, scenario: { qualificationScope: bosScope } })
    const trajectory = resultOf(output.domain)

    expect(trajectory.points.map(point => point.percentile)).toEqual([80, 80, 100, 100, 100])
    expect(trajectory.isHypothetical).toBe(true)
    expect(resultOf(output.presentation).hypotheticalLabel).toBe('Hypothetical Placement in BOS')
  })

  it('finds the percentile crossing from the hypothetical trajectory', () => {
    const output = anchored().percentileCrossing({ through, targetPercentile: 100, scenario: { qualificationScope: bosScope } })
    expect(output.domain).toEqual({ crossingYear: 2028 })
    expect(output.presentation).toEqual({ year: '2028' })
  })

  it('compares trajectories and flags each side separately', () => {
    const output = anchored().seniorityTrajectoryComparison({
      through,
      baselineScenario: { qualificationScope: { base: 'JFK', seat: 'FO', fleet: '320' } },
      comparisonScenario: { qualificationScope: bosScope },
    })
    const comparison = resultOf(output.domain)
    expect(comparison.points.map(point => point.comparisonPercentile)).toEqual([80, 80, 100, 100, 100])
    expect(comparison.baselineIsHypothetical).toBe(false)
    expect(comparison.comparisonIsHypothetical).toBe(true)

    const presented = resultOf(output.presentation)
    expect(presented.baselineHypotheticalLabel).toBeNull()
    expect(presented.comparisonHypotheticalLabel).toBe('Hypothetical Placement in BOS')
  })

  it('keeps Qualification Position company-wide so thresholds and percentile share one scale', () => {
    const subject = anchored()
    const output = subject.qualificationPositions({ through })
    const positions = resultOf(output.domain)
    const companyStanding = resultOf(subject.seniorityStanding().domain)

    expect(positions.length).toBeGreaterThan(0)
    for (const position of positions) {
      expect(position.currentPercentile).toBe(companyStanding.seniorityPercentile)
      expect(position).not.toHaveProperty('isHypothetical')
    }
    for (const position of resultOf(output.presentation)) expect(position).not.toHaveProperty('hypotheticalLabel')
  })

  it('does not accept a Qualification Scope on Qualification Position', () => {
    // @ts-expect-error Qualification Position is company-wide; a scoped percentile would not match its thresholds.
    anchored().qualificationPositions({ through, qualificationScope: bosScope })
  })

  it('places a junior Anchor Pilot after every pilot in the scope', () => {
    const standing = resultOf(anchored(anchorX({ seniority_number: 99 })).seniorityStanding({ scenario: { qualificationScope: bosScope } }).domain)
    expect(standing).toMatchObject({ publicationPosition: 5, rank: 4, rosterSize: 5, seniorityPercentile: 40, isHypothetical: true })
  })

  it('places a senior Anchor Pilot ahead of every pilot in the scope', () => {
    const standing = resultOf(anchored(anchorX({ seniority_number: 5 })).seniorityStanding({ scenario: { qualificationScope: bosScope } }).domain)
    expect(standing).toMatchObject({ publicationPosition: 1, rank: 1, rosterSize: 5, seniorityPercentile: 100, isHypothetical: true })
  })

  it('places the Anchor Pilot alone in a scope with no other pilots', () => {
    const standing = resultOf(anchored().seniorityStanding({ scenario: { qualificationScope: { base: 'LAX' } } }).domain)
    expect(standing).toMatchObject({ rank: 1, rosterSize: 1, activePilotCount: 1, seniorityPercentile: 100, isHypothetical: true })
  })

  it('divides by the grown scope including the Anchor Pilot', () => {
    const growth = { enabled: true, annualGrowthRate: 0.2 }
    const trajectory = resultOf(anchored().seniorityTrajectory({
      through: Temporal.PlainDate.from('2027-06-15'),
      scenario: { qualificationScope: bosScope, growthAssumptions: growth },
    }).domain)
    // Roster 5 grows by round(5 * 0.2) = 1 pilot; Rank stays 2: (6 - 2 + 1) / 6.
    expect(trajectory.points.map(point => point.percentile)).toEqual([80, 83.3])
  })

  it('judges every qualification dimension independently', () => {
    const own = anchored()
    expect(resultOf(own.seniorityStanding({ scenario: { qualificationScope: { base: 'JFK', seat: 'FO', fleet: '320' } } }).domain).isHypothetical).toBe(false)
    expect(resultOf(own.seniorityStanding({ scenario: { qualificationScope: { base: 'JFK', seat: 'CA', fleet: '320' } } }).domain).isHypothetical).toBe(true)
    expect(resultOf(own.seniorityStanding({ scenario: { qualificationScope: { base: 'JFK', seat: 'FO', fleet: '737' } } }).domain).isHypothetical).toBe(true)
  })

  it('keeps Rank within Roster Size on every Qualification Standing row', () => {
    for (const anchor of [anchorX(), anchorX({ seniority_number: 99 }), anchorX({ seniority_number: 5 })]) {
      const standing = resultOf(anchored(anchor).seniorityStanding().domain)
      for (const row of standing.qualificationStandings) {
        expect(row.rank).toBeLessThanOrEqual(row.rosterSize)
        expect(row.isHypothetical).toBe(!row.isAnchorCurrentQualification)
      }
    }
  })

  it('counts the Anchor Pilot in non-member Qualification Standing rows only', () => {
    const rows = resultOf(anchored().seniorityStanding().domain).qualificationStandings
    const bosRow = rows.find(row => row.qualification.base === 'BOS')!
    const ownRow = rows.find(row => row.isAnchorCurrentQualification)!
    expect(bosRow).toMatchObject({ rosterSize: 5, activePilotCount: 4, rank: 2, isHypothetical: true })
    expect(ownRow).toMatchObject({ rosterSize: 1, activePilotCount: 1, rank: 1, isHypothetical: false })

    const presentedRows = resultOf(anchored().seniorityStanding().presentation).qualificationStandings
    expect(presentedRows.find(row => row.qualification.base === 'BOS')!.hypotheticalLabel).toBe('Hypothetical Placement in BOS CA 220')
    expect(presentedRows.find(row => row.isAnchorCurrentQualification)!.hypotheticalLabel).toBeNull()
  })

  it.each([
    ['company-wide', {}],
    ['own qualification', { base: 'JFK', seat: 'FO', fleet: '320' }],
    ['base outside', { base: 'BOS' }],
    ['seat outside', { seat: 'CA' }],
    ['full qualification outside', fullBosScope],
    ['no other pilots', { base: 'LAX' }],
  ] satisfies [string, QualificationScope][])(
    'agrees on one percentile across Standing and trajectory year zero (%s)',
    (_name, scope) => {
      const subject = anchored()
      const standing = resultOf(subject.seniorityStanding({ scenario: { qualificationScope: scope } }).domain)
      const trajectory = resultOf(subject.seniorityTrajectory({ through, scenario: { qualificationScope: scope } }).domain)

      expect(trajectory.points[0]!.percentile).toBe(standing.seniorityPercentile)
    },
  )

  it('also reconciles Qualification Position when the scope is company-wide', () => {
    const subject = anchored()
    const standing = resultOf(subject.seniorityStanding().domain)
    const trajectory = resultOf(subject.seniorityTrajectory({ through: asOfDate }).domain)
    const positions = resultOf(subject.qualificationPositions({ through: asOfDate }).domain)

    expect(positions[0]!.currentPercentile).toBe(standing.seniorityPercentile)
    expect(positions[0]!.projectedPercentile).toBe(trajectory.points[0]!.percentile)
  })
})

describe('Hypothetical Placement and retirement', () => {
  it('returns no-result for a retired Anchor Pilot outside the scope, with the retired reason', () => {
    const retired = anchorX({ retire_date: '2025-01-01' })
    const output = anchored(retired).seniorityStanding({ scenario: { qualificationScope: bosScope } })
    expect(output.domain).toEqual({ kind: 'no-result', reason: 'anchor-retired', label: 'Anchor Pilot retired' })
  })

  it('returns no-result when the Anchor Pilot retires on the As-of Date, in or out of scope', () => {
    const retiring = anchorX({ retire_date: '2026-06-15' })
    for (const scope of [bosScope, {}]) {
      expect(anchored(retiring).seniorityStanding({ scenario: { qualificationScope: scope } }).domain)
        .toMatchObject({ kind: 'no-result', reason: 'anchor-retired' })
    }
  })

  it('treats retirement the day after the As-of Date as active and hypothetical', () => {
    const standing = anchored(anchorX({ retire_date: '2026-06-16' })).seniorityStanding({ scenario: { qualificationScope: bosScope } }).domain
    expect(isNoResult(standing)).toBe(false)
  })

  it('returns no-result projections for a retired Anchor Pilot outside the scope', () => {
    const subject = anchored(anchorX({ retire_date: '2025-01-01' }))
    const scenario = { qualificationScope: bosScope }
    expect(subject.seniorityTrajectory({ through, scenario }).domain).toMatchObject({ reason: 'anchor-retired' })
    expect(subject.percentileCrossing({ through, targetPercentile: 50, scenario }).domain).toMatchObject({ reason: 'anchor-retired' })
    expect(subject.qualificationPositions({ through }).domain).toMatchObject({ reason: 'anchor-retired' })
    expect(subject.seniorityTrajectoryComparison({ through, comparisonScenario: scenario }).domain).toMatchObject({ reason: 'anchor-retired' })
  })

  it('stops a hypothetical trajectory when the Anchor Pilot retires mid-window', () => {
    const output = anchored(anchorX({ retire_date: '2028-01-01' })).seniorityTrajectory({ through, scenario: { qualificationScope: bosScope } })
    const trajectory = resultOf(output.domain)
    expect(trajectory.points.map(point => point.date.toString())).toEqual(['2026-06-15', '2027-06-15'])
    expect(trajectory.endedBy).toMatchObject({ reason: 'anchor-retired' })
    expect(trajectory.isHypothetical).toBe(true)
    expect(resultOf(output.presentation)).toMatchObject({ endedByLabel: 'Projection ends at your retirement', hypotheticalLabel: 'Hypothetical Placement in BOS' })
  })
})

describe('Hypothetical Placement in the Qualification viewer', () => {
  it('measures the inserted marker against the scope including the Anchor Pilot, leaving other rows unchanged', () => {
    const subject = createSeniorityAnalysis({ entries: [...roster, anchorX()], asOfDate })
    const output = subject.qualificationViewer({ qualificationScope: fullBosScope, employeeNumber: 'X', insertSelf: true }).domain
    const marker = output.entries.find(row => row.isMarker)!
    const standing = resultOf(subject.withAnchor('X').seniorityStanding({ scenario: { qualificationScope: fullBosScope } }).domain)

    expect(output.rosterSize).toBe(4)
    expect(marker.qualificationRank).toBe(standing.rank)
    expect(marker.qualificationPercentile).toBe(standing.seniorityPercentile)
    expect(output.entries.find(row => row.employeeNumber === 'B3')).toMatchObject({ qualificationRank: 2, qualificationPercentile: 75 })
  })
})
