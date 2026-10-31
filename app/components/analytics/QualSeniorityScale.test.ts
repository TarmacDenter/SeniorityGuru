import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { PresentedQualificationPosition } from '~/utils/seniority'

function position(overrides: Partial<PresentedQualificationPosition>): PresentedQualificationPosition {
  return {
    qualification: { fleet: '737', seat: 'FO', base: 'JFK' },
    activePilotCount: 1,
    rosterSize: 1,
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
  it('shows active counts and independent scaling for similarly shaped Qualification distributions', async () => {
    const Scale = await import('./QualSeniorityScale.vue')
    const wrapper = await mountSuspended(Scale.default, {
      props: {
        positions: [
          position({
            qualification: { fleet: '737', seat: 'CA', base: 'JFK' },
            activePilotCount: 240,
            percentileDensity: [
              { minimumPercentile: 40, maximumPercentile: 45, pilotCount: 80 },
              { minimumPercentile: 45, maximumPercentile: 50, pilotCount: 160 },
            ],
          }),
          position({
            activePilotCount: 3,
            percentileDensity: [
              { minimumPercentile: 40, maximumPercentile: 45, pilotCount: 1 },
              { minimumPercentile: 45, maximumPercentile: 50, pilotCount: 2 },
            ],
          }),
        ],
      },
    })

    const counts = wrapper.findAll('[data-testid="qualification-scale-active-count"]')
    expect(counts.map(count => count.text())).toEqual(['240 active pilots', '3 active pilots'])
    expect(wrapper.text()).toContain('Heights scale independently for each Qualification')
    expect(wrapper.text()).toContain('distribution shape, not comparable pilot counts')
  })

  it('shows a single active pilot from the supplied count even without density buckets', async () => {
    const Scale = await import('./QualSeniorityScale.vue')
    const wrapper = await mountSuspended(Scale.default, {
      props: { positions: [position({ activePilotCount: 1, percentileDensity: [] })] },
    })

    expect(wrapper.get('[data-testid="qualification-scale-active-count"]').text()).toBe('1 active pilot')
    expect(wrapper.find('[data-testid="qualification-scale-current-position"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="qualification-scale-projected-position"]').attributes('style')).toContain('left: 50%')
    expect(wrapper.text()).toContain('Junior')
    expect(wrapper.text()).toContain('Senior')
  })

  it('retains the no-data message without count labels when there are no Qualification rows', async () => {
    const Scale = await import('./QualSeniorityScale.vue')
    const wrapper = await mountSuspended(Scale.default, { props: { positions: [] } })

    expect(wrapper.text()).toContain('No qual data available.')
    expect(wrapper.find('[data-testid="qualification-scale-active-count"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="qualification-scale-projected-position"]').exists()).toBe(false)
  })

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
    expect(projectedMarkers.map(marker => marker.attributes('style'))).toEqual([
      expect.stringContaining('left: 70%'),
      expect.stringContaining('left: 50%'),
    ])
    const currentMarkers = wrapper.findAll('[data-testid="qualification-scale-current-position"]')
    expect(currentMarkers).toHaveLength(2)
    expect(currentMarkers.map(marker => marker.attributes('style'))).toEqual([
      expect.stringContaining('left: 60%'),
      expect.stringContaining('left: 40%'),
    ])
  })
})
