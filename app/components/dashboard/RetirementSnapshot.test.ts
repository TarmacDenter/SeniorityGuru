import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import RetirementSnapshot from './RetirementSnapshot.vue'

const row = (yearLabel: string, rankLabel: string, percentileLabel: string, changeLabel = '--') => ({ yearLabel, rankLabel, percentileLabel, changeLabel })

const snapshot = {
  retireDateLabel: 'Jun 2040',
  projectedRankLabel: '12',
  percentileLabel: '90.0%',
  pilotsAheadLabel: '11',
  rosterSizeLabel: '120',
  activePilotLabel: '100',
  hypotheticalLabel: null as string | null,
  rows: [row('2038', '20', '85.0%'), row('2039', '15', '88.0%', '-5'), row('2040', '12', '90.0%', '-3')],
}

const mountSnapshot = (value = snapshot) => mountSuspended(RetirementSnapshot, { props: { snapshot: value, years: 3, maxYears: 10 } })

describe('RetirementSnapshot', () => {
  it('shows Rank without a Seniority Number style # prefix', async () => {
    const wrapper = await mountSnapshot()

    expect(wrapper.text()).toContain('Projected Rank')
    expect(wrapper.text()).not.toContain('#12')
  })

  it('labels a Hypothetical Placement trajectory as a stamp and omits it for a member', async () => {
    const hypothetical = await mountSnapshot({ ...snapshot, hypotheticalLabel: 'Hypothetical Placement in BOS' })
    const member = await mountSnapshot()

    expect(hypothetical.get('[data-testid="snapshot-hypothetical"]').text()).toBe('Hypothetical Placement in BOS')
    expect(member.find('[data-testid="snapshot-hypothetical"]').exists()).toBe(false)
  })

  it('labels Roster Size and active pilot count', async () => {
    const wrapper = await mountSnapshot()

    expect(wrapper.text()).toContain('Roster Size today')
    expect(wrapper.text()).toContain('120')
    expect(wrapper.text()).toContain('Active pilots')
    expect(wrapper.text()).toContain('100')
  })

  it('lists the final years with Rank, Seniority Percentile and change as ruled rows', async () => {
    const wrapper = await mountSnapshot()
    const rows = wrapper.findAll('tbody tr').map(tr => tr.findAll('td').map(td => td.text()))

    expect(rows).toEqual([
      ['2038', '20', '85.0%', '--'],
      ['2039', '15', '88.0%', '-5'],
      ['2040', '12', '90.0%', '-3'],
    ])
  })
})
