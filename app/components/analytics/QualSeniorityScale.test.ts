import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { QualDemographicScale } from '~/utils/seniority-engine/types'

function scale(overrides: Partial<QualDemographicScale>): QualDemographicScale {
  return {
    fleet: '737',
    seat: 'FO',
    base: 'JFK',
    activeCount: 1,
    plugPercentile: 50,
    plugSenNum: 100,
    p25: 25,
    median: 50,
    p75: 75,
    max: 100,
    density: [],
    userPercentile: 50,
    currentUserPercentile: 50,
    isHoldable: true,
    ...overrides,
  }
}

describe('QualSeniorityScale', () => {
  it('renders captain qualification scales before first-officer scales', async () => {
    const Scale = await import('./QualSeniorityScale.vue')
    const wrapper = await mountSuspended(Scale.default, {
      props: {
        scales: [
          scale({ fleet: '737', seat: 'FO' }),
          scale({ fleet: '320', seat: 'CA' }),
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
        scales: [
          scale({ seat: 'CA', isHoldable: true, userPercentile: 70, currentUserPercentile: 60 }),
          scale({ seat: 'FO', isHoldable: false, userPercentile: 50, currentUserPercentile: 40 }),
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
