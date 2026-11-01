import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { UApp } from '#components'
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
  hypotheticalLabel: null,
  baseFleetLabel: 'LAX 777',
  rankLabel: '2',
  rosterOfLabel: 'of 4',
  percentileLabel: '75.0%',
  seatLabel: 'First Officer',
}

function mount(props: InstanceType<typeof BaseStatusTable>['$props']) {
  return mountSuspended(defineComponent({ render: () => h(UApp, null, () => h(BaseStatusTable, props)) }), { attachTo: document.body })
}

describe('BaseStatusTable', () => {
  it('labels columns with Base Rank, Roster Size and Seniority Percentile', async () => {
    const wrapper = await mount({ groups: [{ seat: 'FO', seatLabel: 'First Officer', holdabilitySummaryLabel: null, rows: [row] }] })

    const text = wrapper.text()
    expect(text).toContain('Base Rank')
    expect(text).toContain('Roster Size')
    expect(text).toContain('Seniority Percentile')
    expect(text).toContain('of 4')
    expect(text).toContain('75.0%')
  })

  it('explains that Roster Size includes retired pilots behind an info button', async () => {
    const wrapper = await mount({ groups: [{ seat: 'FO', seatLabel: 'First Officer', holdabilitySummaryLabel: null, rows: [row] }] })
    expect(wrapper.text()).not.toContain('Roster Size includes retired pilots')

    await wrapper.find('button[aria-label="About this table"]').trigger('click')
    await vi.waitFor(() => expect(document.body.textContent).toContain('Roster Size includes retired pilots'))
  })

  it('marks only the rows that place you in a qualification you are not in', async () => {
    const other = { ...row, base: 'BOS', seat: 'CA', fleet: '220', isAnchorCurrentQualification: false, hypotheticalLabel: 'Hypothetical Placement in BOS CA 220', seatLabel: 'Captain' }
    const wrapper = await mount({
      groups: [{ seat: 'CA', seatLabel: 'Captain', holdabilitySummaryLabel: null, rows: [other] }, { seat: 'FO', seatLabel: 'First Officer', holdabilitySummaryLabel: null, rows: [row] }],
    })

    const marks = wrapper.findAll('[data-testid="hypothetical-row"]')
    expect(marks).toHaveLength(1)
    expect(marks[0]!.attributes('title')).toBe('Hypothetical Placement in BOS CA 220')
  })

  it('shows the no-result reason instead of an empty table', async () => {
    const wrapper = await mount({ groups: [], noResultLabel: 'Anchor Pilot retired' })

    expect(wrapper.text()).toContain('Anchor Pilot retired')
    expect(wrapper.find('table').exists()).toBe(false)
  })
})
