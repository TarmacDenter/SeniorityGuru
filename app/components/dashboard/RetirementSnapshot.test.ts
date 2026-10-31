import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import RetirementSnapshot from './RetirementSnapshot.vue'

const point = (date: string, rank: number, percentile: number, rankDelta = '--') => ({ date, rank, percentile, rankDelta })

const snapshot = {
  retireDate: '2040-06-15',
  rosterSize: 120,
  activePilotCount: 100,
  atRetirement: point('2040-06-15', 12, 90),
  fullTrajectory: [point('2038-01-01', 20, 85), point('2039-01-01', 15, 88, '-5'), point('2040-06-15', 12, 90, '-3')],
}

describe('RetirementSnapshot', () => {
  it('shows Rank without a Seniority Number style # prefix', async () => {
    const wrapper = await mountSuspended(RetirementSnapshot, { props: { snapshot } })

    expect(wrapper.text()).toContain('Projected Rank')
    expect(wrapper.text()).not.toContain('#12')
    expect(wrapper.text()).not.toContain('#15')
  })

  it('labels a Hypothetical Placement trajectory and omits the label for a member', async () => {
    const hypothetical = await mountSuspended(RetirementSnapshot, {
      props: { snapshot: { ...snapshot, hypotheticalLabel: 'Hypothetical Placement in BOS' } },
    })
    const member = await mountSuspended(RetirementSnapshot, { props: { snapshot } })

    expect(hypothetical.get('[data-testid="hypothetical-placement"]').text()).toBe('Hypothetical Placement in BOS')
    expect(member.find('[data-testid="hypothetical-placement"]').exists()).toBe(false)
  })

  it('labels Roster Size and active pilot count', async () => {
    const wrapper = await mountSuspended(RetirementSnapshot, { props: { snapshot } })

    expect(wrapper.text()).toContain('Roster Size today')
    expect(wrapper.text()).toContain('120')
    expect(wrapper.text()).toContain('Active pilots')
    expect(wrapper.text()).toContain('100')
  })
})
