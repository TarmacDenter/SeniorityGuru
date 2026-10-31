import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BaseStatusTable from './BaseStatusTable.vue'

const row = {
  base: 'LAX',
  seat: 'FO',
  fleet: '777',
  rank: 2,
  publicationPosition: 3,
  rosterSize: 4,
  activePilotCount: 3,
  seniorityPercentile: 75,
  isAnchorCurrentQualification: true,
}

describe('BaseStatusTable', () => {
  it('labels columns with Rank, Roster Size and Seniority Percentile', async () => {
    const wrapper = await mountSuspended(BaseStatusTable, { props: { data: [row] } })

    const text = wrapper.text()
    expect(text).toContain('Rank')
    expect(text).toContain('Roster Size')
    expect(text).toContain('Seniority Percentile')
    expect(text).not.toContain('Total')
    expect(text).not.toContain('Base %ile')
    expect(text).toContain('75%')
  })

  it('explains that Roster Size includes retired pilots', async () => {
    const wrapper = await mountSuspended(BaseStatusTable, { props: { data: [row] } })

    expect(wrapper.text()).toContain('Roster Size includes retired pilots')
  })

  it('shows the no-result reason instead of an empty table', async () => {
    const wrapper = await mountSuspended(BaseStatusTable, { props: { data: [], noResultLabel: 'Anchor Pilot retired' } })

    expect(wrapper.text()).toContain('Anchor Pilot retired')
    expect(wrapper.find('table').exists()).toBe(false)
  })
})
