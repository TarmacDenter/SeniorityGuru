import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockHasData } = vi.hoisted(() => {
  const { ref: vRef } = require('vue')
  return { mockHasData: vRef(false) }
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
  userEntry: { value: undefined },
  hasAnchor: { value: false },
  isNewHireMode: { value: false },
}))

mockNuxtImport('useUserStore', () => () => ({
  employeeNumber: null,
}))

mockNuxtImport('useQualAnalytics', () => () => ({
  selectedFleet: { value: null },
  selectedSeat: { value: null },
  selectedBase: { value: null },
  availableFleets: { value: [] },
  availableSeats: { value: [] },
  availableBases: { value: [] },
  qualSpec: { value: {} },
  qualLabel: { value: '' },
  isBannerDismissed: { value: false },
  qualScales: { value: [] },
  thresholdResult: { value: null },
  targetPercentile: { value: 50 },
  projectionYears: { value: 0 },
  userEntry: { value: undefined },
  dismissBanner: vi.fn(),
}))

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
})
