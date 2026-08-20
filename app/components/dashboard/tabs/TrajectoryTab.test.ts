import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockHasData, mockLens } = vi.hoisted(() => {
  const { ref: vRef } = require('vue')
  return {
    mockHasData: vRef(false) as { value: boolean },
    mockLens: vRef(null) as { value: { retirementWave: ReturnType<typeof vi.fn> } | null },
  }
})

vi.mock('~/components/analytics/RetirementWaveChart.vue', () => ({
  default: {
    props: ['waveBuckets'],
    template: '<div data-testid="retirement-wave-buckets">{{ waveBuckets[0]?.year }}</div>',
  },
}))

vi.mock('~/components/dashboard/GrowthBar.vue', () => ({
  default: { template: '<div />' },
}))

vi.mock('~/components/dashboard/SeniorityComparison.vue', () => ({
  default: { template: '<div />' },
}))

vi.mock('~/components/dashboard/RetirementComparison.vue', () => ({
  default: { template: '<div />' },
}))

vi.mock('~/components/analytics/PercentileThresholdCalculator.vue', () => ({
  default: { template: '<div />' },
}))

const mockQualFilter = {
  selectedFleet: { value: null },
  selectedSeat: { value: null },
  selectedBase: { value: null },
  availableFleets: { value: [] },
  availableSeats: { value: [] },
  availableBases: { value: [] },
  qualSpec: { value: {} },
  qualLabel: { value: '' },
  clear: vi.fn(),
}

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
  lens: mockLens,
  anchoredLens: { value: null },
  userEntry: { value: undefined },
  hasAnchor: { value: false },
  isNewHireMode: { value: false },
}))

mockNuxtImport('useStanding', () => () => ({
  rankCard: { value: { base: '--', seat: '--', fleet: '--', percentile: 0, seniorityNumber: 0, adjustedSeniority: 0, hireDate: '--' } },
  baseStatus: { value: [] },
  statCards: { value: [] },
  retirementSnapshot: { value: null },
}))

mockNuxtImport('useTrajectory', () => () => ({
  chartData: { value: { labels: [], data: [] } },
  deltas: { value: [] },
  computeComparativeTrajectory: vi.fn(),
  computeRetirementProjection: vi.fn(),
}))

mockNuxtImport('useQualFilter', () => () => mockQualFilter)
mockNuxtImport('useDeferredReady', () => () => ({ value: true }))

describe('TrajectoryTab', () => {
  it('shows empty state when no seniority data', async () => {
    mockHasData.value = false
    mockLens.value = null
    const Tab = await import('./TrajectoryTab.vue')
    const wrapper = await mountSuspended(Tab.default)
    expect(wrapper.text()).toContain('No Seniority Data')
  })

  it('shows loading skeleton when loading prop is true', async () => {
    mockHasData.value = true
    mockLens.value = null
    const Tab = await import('./TrajectoryTab.vue')
    const wrapper = await mountSuspended(Tab.default, {
      props: { loading: true },
    })
    expect(wrapper.html()).toContain('skeleton')
  })

  it('renders scoped retirement-wave buckets supplied by the lens', async () => {
    const retirementWave = vi.fn(() => [{ year: 2030, count: 6, isWave: true }])
    mockHasData.value = true
    mockLens.value = { retirementWave }
    const Tab = await import('./TrajectoryTab.vue')
    const wrapper = await mountSuspended(Tab.default)

    expect(retirementWave).toHaveBeenCalledWith(expect.objectContaining({ scopeFilter: {} }))
    expect(wrapper.text()).toContain('Retirement Wave')
    expect(wrapper.get('[data-testid="retirement-wave-buckets"]').text()).toBe('2030')
  })
})
