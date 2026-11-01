import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { BaseStatusRow, QualificationSeatGroup } from '~/composables/seniority'
import QualificationsTab from './QualificationsTab.vue'

function row(overrides: Partial<BaseStatusRow>): BaseStatusRow {
  return {
    base: 'JFK', seat: 'CA', fleet: '737', rank: 3, publicationPosition: 3, rosterSize: 480, activePilotCount: 470,
    seniorityPercentile: 62.4, isAnchorCurrentQualification: false, hypotheticalLabel: null,
    baseFleetLabel: 'JFK 737', rankLabel: '3', rosterOfLabel: 'of 480', percentileLabel: '62.4%', seatLabel: 'Captain',
    ...overrides,
  }
}

const groups: QualificationSeatGroup[] = [{
  seat: 'CA',
  seatLabel: 'Captain',
  rows: [
    row({ isAnchorCurrentQualification: true }),
    row({ baseFleetLabel: 'LAX 777', rankLabel: '40', rosterOfLabel: 'of 90', percentileLabel: '55.6%', hypotheticalLabel: 'Hypothetical Placement in LAX CA 777' }),
  ],
}]

describe('Qualifications panel', () => {
  it('shows Rank, "of N" and percentile as separate cells with the note inside the same stripe', async () => {
    const wrapper = await mountSuspended(QualificationsTab, { props: { loading: false, userFound: true, groups, noResultLabel: null } })

    expect(wrapper.text()).toContain('Captain')
    const stripes = wrapper.findAll('tbody')
    expect(stripes).toHaveLength(2)
    expect(stripes[1]!.findAll('tr')[0]!.findAll('td').map(td => td.text())).toEqual(['LAX 777', '40', 'of 90', '55.6%'])
    expect(stripes[1]!.findAll('tr')[1]!.text()).toBe('Hypothetical Placement in LAX CA 777')
    expect(stripes[0]!.text()).not.toContain('Hypothetical Placement')
  })

  it('says why there is no Rank instead of showing the directory', async () => {
    const wrapper = await mountSuspended(QualificationsTab, { props: { loading: false, userFound: true, groups: [], noResultLabel: 'Anchor Pilot retired' } })
    expect(wrapper.text()).toContain('Anchor Pilot retired')
    expect(wrapper.find('table').exists()).toBe(false)
  })
})
