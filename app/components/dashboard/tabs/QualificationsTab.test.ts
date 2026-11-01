import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { HoldabilityDetailView, HoldabilityRow, HoldabilitySeatGroup } from '~/composables/seniority'
import QualificationsTab from './QualificationsTab.vue'

vi.mock('vue-chartjs', () => ({ Bar: { template: '<div />' }, Line: { template: '<div />' }, Doughnut: { template: '<div />' } }))

function row(overrides: Partial<HoldabilityRow>): HoldabilityRow {
  return {
    base: 'JFK', seat: 'CA', fleet: '737', rank: 3, publicationPosition: 3, rosterSize: 480, activePilotCount: 470,
    seniorityPercentile: 62.4, isAnchorCurrentQualification: false, hypotheticalLabel: null,
    baseFleetLabel: 'JFK 737', rankLabel: '3', rosterOfLabel: 'of 480', percentileLabel: '62.4%', seatLabel: 'Captain',
    key: '737 CA JFK', isAnchor: false, holdableLabel: 'Holdable now', holdableStatus: 'now', thresholdRelationLabel: null,
    ...overrides,
  }
}

const groups: HoldabilitySeatGroup[] = [{
  seat: 'CA',
  seatLabel: 'Captain',
  rows: [
    row({ isAnchorCurrentQualification: true, isAnchor: true }),
    row({
      key: '777 CA LAX', baseFleetLabel: 'LAX 777', rankLabel: '91', rosterOfLabel: 'of 91', percentileLabel: '1.1%',
      hypotheticalLabel: 'Hypothetical Placement in LAX CA 777',
      holdableLabel: 'Holdable from 2029', holdableStatus: 'later',
      thresholdRelationLabel: 'Junior to the most junior pilot (Seniority Number 812)',
    }),
    row({
      key: '787 CA SFO', baseFleetLabel: 'SFO 787', holdableLabel: 'Not before your retirement', holdableStatus: 'never',
      thresholdRelationLabel: 'Junior to the most junior pilot (Seniority Number 40)',
    }),
  ],
}]

const columnLabels = { qualification: 'Qualification', rank: 'Today\'s Rank', rosterSize: 'Roster Size', percentile: 'Seniority Percentile', status: 'Holdable' }

const detail: HoldabilityDetailView = {
  qualificationLabel: '777 CA LAX',
  holdableLabel: 'Holdable from 2029',
  thresholdPercentile: 70,
  thresholdPercentileLabel: '70.0%',
  labels: ['2026-06-15', '2027-06-15'],
  anchorSeries: [40, 55],
  thresholdPilotSeries: [70, 72],
}

function props(overrides: Record<string, unknown> = {}) {
  return {
    loading: false, userFound: true, groups, noResultLabel: null, columnLabels,
    selectedKey: null, detail: null, juniorCaptainsLink: '/dashboard/demographics#junior-captains',
    seatOptions: [{ label: 'Captain', value: 'CA' }, { label: 'First Officer', value: 'FO' }], selectedSeat: 'CA',
    ...overrides,
  }
}

const global = {
  stubs: {
    UPopover: { template: '<div><slot /><slot name="content" /></div>' },
    DashboardQualificationPositions: { template: '<div />' },
  },
}

describe('Current › Holdability', () => {
  it('heads the Rank column "Today\'s Rank" and shows every Qualification\'s Holdable status', async () => {
    const wrapper = await mountSuspended(QualificationsTab, { props: props(), global })
    const text = wrapper.text()

    expect(text).toContain('Today\'s Rank')
    expect(text).toContain('Holdable now')
    expect(text).toContain('Holdable from 2029')
    expect(text).toContain('Not before your retirement')
  })

  it('offers one seat at a time', async () => {
    const wrapper = await mountSuspended(QualificationsTab, { props: props(), global })
    const tab = wrapper.findAll('button').find(candidate => candidate.text() === 'First Officer')!
    await tab.trigger('mousedown')
    await tab.trigger('click')
    expect(wrapper.emitted('update:selectedSeat')?.at(-1)).toEqual(['FO'])
  })

  it('says when you are junior to the most junior pilot in a Qualification', async () => {
    const wrapper = await mountSuspended(QualificationsTab, { props: props(), global })
    expect(wrapper.text()).toContain('Junior to the most junior pilot (Seniority Number 812)')
  })

  it('asks to show the detail when a Qualification is chosen', async () => {
    const wrapper = await mountSuspended(QualificationsTab, { props: props(), global })
    const button = wrapper.findAll('button').find(candidate => candidate.text().includes('LAX 777'))!
    await button.trigger('click')
    expect(wrapper.emitted('select')).toEqual([['777 CA LAX']])
  })

  it('shows the chosen Qualification\'s chart legend and the link to Junior captains', async () => {
    const wrapper = await mountSuspended(QualificationsTab, { props: props({ selectedKey: '777 CA LAX', detail }), global })
    const text = wrapper.text()

    expect(text).toContain('Your Seniority Percentile')
    expect(text).toContain('Qualification Threshold today')
    expect(text).toContain('Today\'s most junior pilot')
    const link = wrapper.findAll('a').find(candidate => candidate.text().includes('Junior captains'))!
    expect(link.attributes('href')).toBe('/dashboard/demographics#junior-captains')
  })

  it('keeps the Holdable caveats behind the info icon and never says "Plug"', async () => {
    const wrapper = await mountSuspended(QualificationsTab, { props: props({ selectedKey: '777 CA LAX', detail }), global })
    expect(wrapper.text()).toContain('Holdable is a modeled outcome, not a vacancy or an award.')
    expect(wrapper.text()).not.toMatch(/plug/i)
  })

  it('says why there is no Rank instead of showing the Qualifications', async () => {
    const wrapper = await mountSuspended(QualificationsTab, { props: props({ groups: [], noResultLabel: 'Anchor Pilot retired' }), global })
    expect(wrapper.text()).toContain('Anchor Pilot retired')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('asks for an Employee Number when there is no Anchor Pilot', async () => {
    const wrapper = await mountSuspended(QualificationsTab, { props: props({ userFound: false, groups: [] }), global })
    expect(wrapper.text()).toContain('No Qualifications yet')
    expect(wrapper.text()).not.toContain('Today\'s Rank')
  })
})
