import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { RankCardData } from '~/composables/seniority'
import SeniorityRankCard from './SeniorityRankCard.vue'

const rank: RankCardData = {
  seniorityNumber: 90,
  listRank: 3,
  listPilotCount: 4,
  activeRank: 2,
  activePilotCount: 3,
  percentile: 66.7,
  isSimulated: false,
  base: 'LAX',
  seat: 'FO',
  fleet: '777',
  hireDate: '2012-03-01',
}

describe('SeniorityRankCard', () => {
  it('pairs Seniority Number and both ranks with their correct labels and counts', async () => {
    const wrapper = await mountSuspended(SeniorityRankCard, { props: { rank } })

    expect(wrapper.get('[data-testid="seniority-number"]').text()).toBe('Seniority Number #90')
    expect(wrapper.get('[data-testid="list-rank"]').findAll('p').map(item => item.text())).toEqual(['List Rank', '3 of 4'])
    expect(wrapper.get('[data-testid="active-rank"]').findAll('p').map(item => item.text())).toEqual(['Active Rank', '2 of 3'])
    expect(wrapper.text()).toContain('Active Seniority Percentile')
    expect(wrapper.text()).toContain('66.7%')
    expect(wrapper.text()).toContain('Percentile among 3 active pilots.')
  })

  it('updates the percentile bar when switching Anchor Pilots', async () => {
    const wrapper = await mountSuspended(SeniorityRankCard, { props: { rank } })

    await wrapper.setProps({ rank: { ...rank, percentile: 25, isSimulated: true } })

    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('25')
    expect(wrapper.text()).toContain('25%')

    await wrapper.setProps({ rank })

    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('66.7')
    expect(wrapper.text()).not.toContain('Modeled counts include the simulated pilot.')
  })

  it('labels simulated numbers and explains that modeled counts include the simulated pilot', async () => {
    const wrapper = await mountSuspended(SeniorityRankCard, {
      props: { rank: { ...rank, seniorityNumber: 91, listRank: 4, activeRank: 4, activePilotCount: 4, percentile: 25, isSimulated: true } },
    })

    expect(wrapper.get('[data-testid="seniority-number"]').text()).toBe('Simulated Seniority Number #91')
    expect(wrapper.get('[data-testid="list-rank"]').findAll('p').map(item => item.text())).toEqual(['List Rank', '4 of 4'])
    expect(wrapper.get('[data-testid="active-rank"]').findAll('p').map(item => item.text())).toEqual(['Active Rank', '4 of 4'])
    expect(wrapper.text()).toContain('Modeled counts include the simulated pilot.')
  })
})
