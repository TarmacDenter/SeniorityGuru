import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { RankCardData } from '~/composables/seniority'
import SeniorityRankCard from './SeniorityRankCard.vue'

const rank: RankCardData = {
  seniorityNumber: 90,
  publicationPosition: 3,
  rosterSize: 4,
  rank: 2,
  activePilotCount: 3,
  seniorityPercentile: 75,
  isSimulated: false,
  base: 'LAX',
  seat: 'FO',
  fleet: '777',
  noResultLabel: null,
  hireDate: '2012-03-01',
}

describe('SeniorityRankCard', () => {
  it('pairs Seniority Number and both ranks with their correct labels and counts', async () => {
    const wrapper = await mountSuspended(SeniorityRankCard, { props: { rank } })

    expect(wrapper.get('[data-testid="seniority-number"]').text()).toBe('Seniority Number #90')
    expect(wrapper.get('[data-testid="publication-position"]').findAll('p').map(item => item.text())).toEqual(['Publication Position', '3 of 4'])
    expect(wrapper.get('[data-testid="rank"]').findAll('p').map(item => item.text())).toEqual(['Rank', '2 of 4'])
    expect(wrapper.text()).toContain('Seniority Percentile')
    expect(wrapper.text()).toContain('75%')
    expect(wrapper.text()).toContain('Percentile of Rank among 4 pilots (3 active).')
  })

  it('updates the percentile bar when switching Anchor Pilots', async () => {
    const wrapper = await mountSuspended(SeniorityRankCard, { props: { rank } })

    await wrapper.setProps({ rank: { ...rank, seniorityPercentile: 25, isSimulated: true } })

    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('25')
    expect(wrapper.text()).toContain('25%')

    await wrapper.setProps({ rank })

    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('75')
    expect(wrapper.text()).not.toContain('Modeled counts include the simulated pilot.')
  })

  it('labels simulated numbers and explains that modeled counts include the simulated pilot', async () => {
    const wrapper = await mountSuspended(SeniorityRankCard, {
      props: { rank: { ...rank, seniorityNumber: 91, publicationPosition: 4, rank: 4, rosterSize: 4, activePilotCount: 4, seniorityPercentile: 25, isSimulated: true } },
    })

    expect(wrapper.get('[data-testid="seniority-number"]').text()).toBe('Simulated Seniority Number #91')
    expect(wrapper.get('[data-testid="publication-position"]').findAll('p').map(item => item.text())).toEqual(['Publication Position', '4 of 4'])
    expect(wrapper.get('[data-testid="rank"]').findAll('p').map(item => item.text())).toEqual(['Rank', '4 of 4'])
    expect(wrapper.text()).toContain('Modeled counts include the simulated pilot.')
  })

  it('shows the no-result reason in place of Rank and Seniority Percentile', async () => {
    const wrapper = await mountSuspended(SeniorityRankCard, {
      props: { rank: { ...rank, rank: 0, publicationPosition: 0, rosterSize: 0, noResultLabel: 'Anchor Pilot retired' } },
    })

    expect(wrapper.get('[data-testid="no-result"]').text()).toBe('Anchor Pilot retired')
    expect(wrapper.find('[data-testid="rank"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Seniority Percentile')
  })
})
