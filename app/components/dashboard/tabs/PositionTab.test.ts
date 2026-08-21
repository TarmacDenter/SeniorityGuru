import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { parsePlainDate } from '~/utils/temporal'

vi.mock('~/components/dashboard/GrowthBar.vue', () => ({
  default: { template: '<div />' },
}))

const { mockAnchoredLens, mockHasData } = vi.hoisted(() => {
  const { ref: vRef } = require('vue')
  return {
    mockAnchoredLens: vRef(null) as { value: { qualScales: () => unknown[] } | null },
    mockHasData: vRef(false),
  }
})

mockNuxtImport('useSeniorityCore', () => () => ({
  hasData: mockHasData,
  newHire: {
    enabled: { value: false },
    syntheticEntry: { value: null },
    availableBases: { value: [] },
    availableSeats: { value: [] },
    availableFleets: { value: [] },
    realUserFound: { value: false },
    isConfigured: { value: false },
    retireDate: { value: null },
    selectedBase: { value: null },
    selectedSeat: { value: null },
    selectedFleet: { value: null },
    birthDate: { value: null },
    reset: vi.fn(),
  },
  snapshot: { value: null },
  lens: { value: null },
  anchoredLens: mockAnchoredLens,
  userEntry: { value: undefined },
  hasAnchor: { value: false },
  isNewHireMode: { value: false },
  projectionEndDate: { value: parsePlainDate('2040-06-15') },
}))

mockNuxtImport('useUser', () => () => ({ employeeNumber: { value: null } }))

describe('PositionTab', () => {
  it('shows empty state when no seniority data', async () => {
    mockHasData.value = false
    const Tab = await import('./PositionTab.vue')
    const wrapper = await mountSuspended(Tab.default)
    expect(wrapper.text()).toContain('No Seniority Data')
  })

  it('shows loading skeleton when loading prop is true', async () => {
    const Tab = await import('./PositionTab.vue')
    const wrapper = await mountSuspended(Tab.default, {
      props: { loading: true },
    })
    expect(wrapper.html()).toContain('skeleton')
  })

  it('renders anchored qualification-scale holdability states', async () => {
    mockHasData.value = true
    mockAnchoredLens.value = {
      qualScales: () => [
        {
          fleet: '737', seat: 'CA', base: 'JFK', activeCount: 1,
          plugPercentile: 60, plugSenNum: 100, p25: 25, median: 50, p75: 75, max: 100,
          density: [], userPercentile: 70, currentUserPercentile: 60, isHoldable: true,
        },
        {
          fleet: '737', seat: 'FO', base: 'JFK', activeCount: 1,
          plugPercentile: 60, plugSenNum: 100, p25: 25, median: 50, p75: 75, max: 100,
          density: [], userPercentile: 50, currentUserPercentile: 40, isHoldable: false,
        },
      ],
    }
    const Tab = await import('./PositionTab.vue')
    const wrapper = await mountSuspended(Tab.default)

    const projectedMarkers = wrapper.findAll('[data-testid="qualification-scale-projected-position"]')
    expect(projectedMarkers).toHaveLength(2)
    expect(projectedMarkers[0]!.classes()).toContain('bg-[var(--ui-color-success-500)]')
    expect(projectedMarkers[1]!.classes()).toContain('bg-[var(--ui-color-primary-500)]')
  })
})
