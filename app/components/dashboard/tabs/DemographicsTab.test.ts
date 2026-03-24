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
  mostJuniorCAs: { value: [] },
  qualComposition: { value: [] },
  ageDistribution: { value: { buckets: [], nullCount: 0 } },
  yosDistribution: { value: { mean: 0, median: 0, p25: 0, p75: 0 } },
  yosHistogram: { value: [] },
  userEntry: { value: undefined },
  dismissBanner: vi.fn(),
  thresholdResult: { value: null },
  targetPercentile: { value: 50 },
  retirementWave: { value: [] },
  waveTrajectory: { value: [] },
  trajectoryDeltas: { value: [] },
  qualScales: { value: [] },
  projectionYears: { value: 0 },
}))

describe('DemographicsTab', () => {
  it('shows empty state when no seniority data', async () => {
    mockHasData.value = false
    const Tab = await import('./DemographicsTab.vue')
    const wrapper = await mountSuspended(Tab.default)
    expect(wrapper.text()).toContain('No Seniority Data')
  })

  it('shows loading skeleton when loading', async () => {
    const Tab = await import('./DemographicsTab.vue')
    const wrapper = await mountSuspended(Tab.default, {
      props: { loading: true },
    })
    // Skeleton should be visible
    expect(wrapper.find('[class*="skeleton"]').exists() || wrapper.html().includes('skeleton')).toBe(true)
  })
})
