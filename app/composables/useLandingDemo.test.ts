import { describe, it, expect } from 'vitest'
import { useLandingDemo } from './useLandingDemo'

describe('useLandingDemo', () => {
  it('places the sample pilot at 35.0% today in every Qualification, holdable only where the threshold is lower', () => {
    const demo = useLandingDemo()
    demo.projection.value = false

    const positions = demo.qualificationPositions.value
    expect(positions.map(p => `${p.qualification.fleet} ${p.qualification.seat} ${p.qualification.base}`)).toEqual([
      'E175 FO DEN', 'E175 CA DEN', 'A320 FO ORD', 'A320 CA ORD',
    ])
    expect(positions.map(p => p.projectedPercentile)).toEqual([35, 35, 35, 35])
    expect(positions.map(p => p.modeledHoldable)).toEqual([true, false, true, false])
  })

  it('projects the sample pilot forward when Project forward is on', () => {
    const demo = useLandingDemo()
    demo.projection.value = true
    demo.projectionYears.value = 5

    const positions = demo.qualificationPositions.value
    expect(positions.map(p => p.projectedPercentile)).toEqual([51, 51, 51, 51])
    expect(positions.map(p => p.modeledHoldable)).toEqual([true, true, true, true])
    expect(demo.projectionLabel.value).toBe('+5 yrs')

    demo.projectionYears.value = 1
    expect(demo.projectionLabel.value).toBe('+1 yr')
  })

  it('switches the sample age and retirement counts by seat', () => {
    const demo = useLandingDemo()
    expect(demo.seatOptions.map(o => o.label)).toEqual(['All Pilots', 'FO', 'CA'])

    demo.seat.value = 'ca'
    expect(demo.ageBuckets.value[0]).toEqual({ label: '25–30', count: 22 })
    expect(demo.waveBuckets.value[0]).toEqual({ year: 2026, retirementCount: 43, isRetirementWave: true })

    demo.seat.value = 'all'
    expect(demo.ageBuckets.value[0]).toEqual({ label: '25–30', count: 187 })
  })
})
