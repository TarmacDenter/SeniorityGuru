import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { RankCardData } from '~/composables/seniority'
import SeniorityRankCard from './SeniorityRankCard.vue'

const rank: RankCardData = {
  seniorityNumber: 90,
  publicationPosition: 3,
  rosterSize: 4,
  publicationPilotCount: 4,
  rank: 2,
  activePilotCount: 3,
  seniorityPercentile: 75,
  isSimulated: false,
  base: 'LAX',
  seat: 'FO',
  fleet: '777',
  noResultLabel: null,
  hypotheticalLabel: null,
  hireDate: '2012-03-01',
}

describe('SeniorityRankCard', () => {
  it('pairs Seniority Number and both ranks with their correct labels and counts', async () => {
    const wrapper = await mountSuspended(SeniorityRankCard, { props: { rank } })

    expect(wrapper.get('[data-testid="seniority-number"]').text()).toBe('Seniority Number #90')
    expect(wrapper.get('[data-testid="publication-position"]').findAll('p').map(item => item.text())).toEqual(['Publication Position', '3'])
    expect(wrapper.get('[data-testid="rank"]').findAll('p').map(item => item.text())).toEqual(['Rank', '2'])
    expect(wrapper.text()).toContain('Seniority Percentile')
    expect(wrapper.text()).toContain('75%')
    expect(wrapper.get('[data-testid="rank-summary"]').text()).toBe(
      'Rank 2 of 4 on roster · 3 active · Publication Position 3 · Seniority Number 90',
    )
    expect(wrapper.get('[data-testid="roster-size"]').findAll('p').map(item => item.text())).toEqual(['Roster Size', '4'])
    expect(wrapper.get('[data-testid="active-pilots"]').findAll('p').map(item => item.text())).toEqual(['Active pilots', '3'])
    expect(wrapper.text().match(/Seniority Percentile/g)).toHaveLength(1)
  })

  it('updates the percentile bar when switching Anchor Pilots', async () => {
    const wrapper = await mountSuspended(SeniorityRankCard, { props: { rank } })

    await wrapper.setProps({ rank: { ...rank, seniorityPercentile: 25, isSimulated: true } })

    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('25')
    expect(wrapper.text()).toContain('25%')

    await wrapper.setProps({ rank })

    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('75')
    expect(wrapper.text()).not.toContain('Modeled counts include the simulated pilot (3 in publication).')
  })

  it('labels simulated numbers and explains that modeled counts include the simulated pilot', async () => {
    const wrapper = await mountSuspended(SeniorityRankCard, {
      props: { rank: { ...rank, seniorityNumber: 91, publicationPosition: 4, rank: 4, rosterSize: 4, publicationPilotCount: 3, activePilotCount: 4, seniorityPercentile: 25, isSimulated: true } },
    })

    expect(wrapper.get('[data-testid="seniority-number"]').text()).toBe('Simulated Seniority Number #91')
    expect(wrapper.get('[data-testid="publication-position"]').findAll('p').map(item => item.text())).toEqual(['Publication Position', '4'])
    expect(wrapper.get('[data-testid="rank"]').findAll('p').map(item => item.text())).toEqual(['Rank', '4'])
    expect(wrapper.text()).toContain('Modeled counts include the simulated pilot (3 in publication).')
  })

  it('names the scope and says you are not in it for a Hypothetical Placement', async () => {
    const wrapper = await mountSuspended(SeniorityRankCard, {
      props: { rank: { ...rank, hypotheticalLabel: 'Hypothetical Placement in BOS CA 220' } },
    })

    const note = wrapper.get('[data-testid="hypothetical-placement"]')
    expect(note.text()).toContain('Hypothetical Placement in BOS CA 220')
    expect(note.text()).toContain('You are not in this scope')
    expect(wrapper.find('[data-testid="rank"]').exists()).toBe(true)
  })

  it('shows both the modeled and hypothetical labels in New Hire Mode', async () => {
    const wrapper = await mountSuspended(SeniorityRankCard, {
      props: { rank: { ...rank, isSimulated: true, hypotheticalLabel: 'Hypothetical Placement in BOS' } },
    })

    expect(wrapper.text()).toContain('Modeled counts include the simulated pilot')
    expect(wrapper.get('[data-testid="hypothetical-placement"]').text()).toContain('Hypothetical Placement in BOS')
  })

  it('shows no Hypothetical Placement note for a member of the scope', async () => {
    const wrapper = await mountSuspended(SeniorityRankCard, { props: { rank } })

    expect(wrapper.find('[data-testid="hypothetical-placement"]').exists()).toBe(false)
  })

  it('shows the no-result reason with an empty placeholder in place of every figure that needs a Rank', async () => {
    const wrapper = await mountSuspended(SeniorityRankCard, {
      props: {
        rank: {
          ...rank,
          rank: null,
          publicationPosition: null,
          rosterSize: null,
          publicationPilotCount: null,
          activePilotCount: null,
          seniorityPercentile: null,
          noResultLabel: 'Anchor Pilot retired',
        },
      },
    })

    expect(wrapper.get('[data-testid="no-result"]').text()).toBe('Anchor Pilot retired')
    expect(wrapper.get('[data-testid="rank"]').findAll('p').map(item => item.text())).toEqual(['Rank', '--'])
    expect(wrapper.get('[data-testid="roster-size"]').findAll('p').map(item => item.text())).toEqual(['Roster Size', '--'])
    expect(wrapper.get('[data-testid="active-pilots"]').findAll('p').map(item => item.text())).toEqual(['Active pilots', '--'])
    expect(wrapper.text()).not.toContain('Seniority Percentile')
    expect(wrapper.text()).not.toMatch(/Roster Size\s*0/)
  })
})
