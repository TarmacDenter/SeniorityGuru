// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { resultOf } from '~/test-utils/no-result'
import { makeDomainEntry as makeEntry } from '~/test-utils/factories'
import { Temporal } from '~/utils/temporal'
import { createSeniorityAnalysis } from './seniority'

const asOfDate = Temporal.PlainDate.from('2026-06-15')
const jfkCaptain = { base: 'JFK', seat: 'CA', fleet: '737' }
const jfkFirstOfficer = { base: 'JFK', seat: 'FO', fleet: '737' }
const laxFirstOfficer = { base: 'LAX', seat: 'FO', fleet: '777' }

// Company-wide today (Roster Size 6): the anchor (5) sits at 33.3%. Thresholds: JFK CA 737 is S2 at 83.3%,
// LAX FO 777 is S4 at 50.0%, JFK FO 737 is S6 at 16.7%. S1 retires in 2028 and S2 in 2031.
const roster = [
  makeEntry({ seniority_number: 1, employee_number: 'S1', ...jfkCaptain, retire_date: '2028-01-01' }),
  makeEntry({ seniority_number: 2, employee_number: 'S2', ...jfkCaptain, retire_date: '2031-01-01' }),
  makeEntry({ seniority_number: 3, employee_number: 'S3', ...laxFirstOfficer, retire_date: '2050-01-01' }),
  makeEntry({ seniority_number: 4, employee_number: 'S4', ...laxFirstOfficer, retire_date: '2050-01-01' }),
  makeEntry({ seniority_number: 5, employee_number: 'A', ...jfkFirstOfficer, retire_date: '2040-01-01' }),
  makeEntry({ seniority_number: 6, employee_number: 'S6', ...jfkFirstOfficer, retire_date: '2050-01-01' }),
]

const growth = { enabled: true, annualGrowthRate: 0.5 }

function anchored(options: { modeledEntry?: ReturnType<typeof makeEntry> } = {}) {
  const analysis = createSeniorityAnalysis({ entries: roster, asOfDate, modeledEntry: options.modeledEntry })
  return analysis.withAnchor(options.modeledEntry?.employee_number ?? 'A')
}

function holdabilityOf(qualification: typeof jfkCaptain, analysis = anchored(), growthAssumptions?: typeof growth) {
  const presented = resultOf(analysis.qualificationPositions({ through: asOfDate, growthAssumptions }).presentation)
  return presented.find(position =>
    position.qualification.base === qualification.base
    && position.qualification.seat === qualification.seat
    && position.qualification.fleet === qualification.fleet,
  )!
}

describe('Holdable Year per Qualification', () => {
  it('is "now" when the Anchor Pilot is already senior to the Qualification Threshold', () => {
    const position = holdabilityOf(jfkFirstOfficer)
    expect(position.holdableYear).toBe('now')
    expect(position.holdableLabel).toBe('Holdable now')
  })

  it('is the first projection year in which the projected Seniority Percentile meets the threshold', () => {
    const position = holdabilityOf(laxFirstOfficer)
    expect(position.holdableYear).toBe(2028)
    expect(position.holdableLabel).toBe('Holdable from 2028')
  })

  it('is a no-result when the trajectory ends at retirement before the threshold is met', () => {
    const position = holdabilityOf(jfkCaptain)
    expect(position.holdableYear).toBeNull()
    expect(position.holdableLabel).toBe('Not before your retirement')
  })

  it('says when the Anchor Pilot is junior to the Qualification\'s most junior pilot, and not when senior', () => {
    expect(holdabilityOf(laxFirstOfficer).thresholdRelationLabel).toBe('Junior to the most junior pilot (Seniority Number 4)')
    expect(holdabilityOf(jfkCaptain).thresholdRelationLabel).toBe('Junior to the most junior pilot (Seniority Number 2)')
    expect(holdabilityOf(jfkFirstOfficer).thresholdRelationLabel).toBeNull()
  })

  it('is never "now" for an Anchor Pilot junior to the threshold pilot, even when rounded percentiles tie', () => {
    // 4,000 pilots: the threshold pilot (Rank 1,000) and the anchor (Rank 1,001) both round to 75.0%.
    const entries = Array.from({ length: 4000 }, (_, index) => makeEntry({
      seniority_number: index + 1,
      employee_number: `P${index + 1}`,
      ...(index + 1 === 1000 ? laxFirstOfficer : jfkFirstOfficer),
      retire_date: index + 1 === 1001 ? '2040-01-01' : '2050-01-01',
    }))
    const analysis = createSeniorityAnalysis({ entries, asOfDate }).withAnchor('P1001')
    const position = holdabilityOf(laxFirstOfficer, analysis)
    expect(position.currentPercentile).toBe(position.thresholdPercentile)
    expect(position.holdableLabel).toBe('Not before your retirement')
    expect(position.thresholdRelationLabel).toBe('Junior to the most junior pilot (Seniority Number 1000)')
  })

  it('applies Growth Assumptions to the projected Seniority Percentile', () => {
    expect(holdabilityOf(jfkCaptain, anchored(), growth).holdableLabel).toBe('Holdable from 2029')
  })

  it('does not move with Project forward: it is measured from the As-of Date', () => {
    const analysis = anchored()
    const projected = resultOf(analysis.qualificationPositions({ through: Temporal.PlainDate.from('2030-06-15') }).presentation)
    expect(projected.find(position => position.qualification.base === 'LAX')!.holdableLabel).toBe('Holdable from 2028')
  })

  it('uses the Hypothetical Placement in new-hire mode', () => {
    const newHire = makeEntry({ seniority_number: 7, employee_number: '_new_hire', ...laxFirstOfficer, retire_date: '2060-01-01' })
    const analysis = anchored({ modeledEntry: newHire })
    // Roster Size 7: the new hire sits at 14.3%; JFK FO 737's threshold (S6) is 28.6%, reached when S1 retires.
    expect(holdabilityOf(jfkFirstOfficer, analysis).holdableLabel).toBe('Holdable from 2028')
    // JFK CA 737's threshold (S2) is 85.7%; the new hire reaches it once S3, S4 and S6 retire in 2050.
    expect(holdabilityOf(jfkCaptain, analysis).holdableLabel).toBe('Holdable from 2050')
  })
})

describe('Holdability detail: the Anchor Pilot against one Qualification Threshold', () => {
  it('returns the Anchor Pilot series and today\'s threshold pilot series on one company-wide scale', () => {
    const detail = resultOf(anchored().holdabilityDetail({ qualification: jfkCaptain }).presentation)!

    expect(detail.qualificationLabel).toBe('737 CA JFK')
    expect(detail.thresholdPercentile).toBe(83.3)
    expect(detail.thresholdPercentileLabel).toBe('83.3%')
    expect(detail.labels.slice(0, 6)).toEqual(['2026-06-15', '2027-06-15', '2028-06-15', '2029-06-15', '2030-06-15', '2031-06-15'])
    expect(detail.labels.at(-1)).toBe('2039-06-15')
    expect(detail.anchorSeries.slice(0, 6)).toEqual([33.3, 33.3, 50, 50, 50, 66.7])
    // S2 holds the threshold today and retires at the start of 2031.
    expect(detail.thresholdPilotSeries.slice(0, 6)).toEqual([83.3, 83.3, 100, 100, 100, null])
  })

  it('applies Growth Assumptions to both series', () => {
    const detail = resultOf(anchored().holdabilityDetail({ qualification: jfkCaptain, growthAssumptions: growth }).presentation)!
    expect(detail.anchorSeries[1]).toBe(55.6)
    expect(detail.thresholdPilotSeries[1]).toBe(88.9)
  })

  it('has no detail once the Anchor Pilot has retired', () => {
    const analysis = createSeniorityAnalysis({ entries: roster, asOfDate: Temporal.PlainDate.from('2045-01-01') }).withAnchor('A')
    expect(analysis.holdabilityDetail({ qualification: laxFirstOfficer }).presentation).toMatchObject({ kind: 'no-result' })
  })
})
