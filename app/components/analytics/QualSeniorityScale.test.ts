import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { PresentedQualificationPosition } from '~/utils/seniority'

function position(overrides: Partial<PresentedQualificationPosition>): PresentedQualificationPosition {
  return {
    qualification: { fleet: '737', seat: 'FO', base: 'JFK' },
    activePilotCount: 1,
    thresholdPercentile: 50,
    thresholdSeniorityNumber: 100,
    percentile25: 25,
    medianPercentile: 50,
    percentile75: 75,
    maximumPercentile: 100,
    percentileDensity: [],
    projectedPercentile: 50,
    currentPercentile: 50,
    modeledHoldable: true,
    ...overrides,
  }
}

describe('QualSeniorityScale', () => {
  it('renders captain qualification scales before first-officer scales', async () => {
    const Scale = await import('./QualSeniorityScale.vue')
    const wrapper = await mountSuspended(Scale.default, {
      props: {
        positions: [
          position({ qualification: { fleet: '737', seat: 'FO', base: 'JFK' } }),
          position({ qualification: { fleet: '320', seat: 'CA', base: 'JFK' } }),
        ],
      },
    })

    const rendered = wrapper.text()
    expect(rendered.indexOf('320 CA')).toBeLessThan(rendered.indexOf('737 FO'))
  })

  it('renders projected position markers with holdability state and current-position ghosts', async () => {
    const Scale = await import('./QualSeniorityScale.vue')
    const wrapper = await mountSuspended(Scale.default, {
      props: {
        positions: [
          position({
            qualification: { fleet: '737', seat: 'CA', base: 'JFK' },
            modeledHoldable: true,
            projectedPercentile: 70,
            currentPercentile: 60,
          }),
          position({
            qualification: { fleet: '737', seat: 'FO', base: 'JFK' },
            modeledHoldable: false,
            projectedPercentile: 50,
            currentPercentile: 40,
          }),
        ],
      },
    })

    const projectedMarkers = wrapper.findAll('[data-testid="qualification-scale-projected-position"]')
    expect(projectedMarkers).toHaveLength(2)
    expect(projectedMarkers[0]!.classes()).toContain('bg-[var(--ui-color-success-500)]')
    expect(projectedMarkers[1]!.classes()).toContain('bg-[var(--ui-color-primary-500)]')
    expect(wrapper.findAll('[data-testid="qualification-scale-current-position"]')).toHaveLength(2)
  })
})
