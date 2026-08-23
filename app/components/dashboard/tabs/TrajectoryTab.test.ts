import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockAnalysis, mockHasData } = vi.hoisted(() => {
  const { ref: vRef } = require('vue')
  return {
    mockAnalysis: vRef(null) as { value: { retirementYearAnalysis: ReturnType<typeof vi.fn> } | null },
    mockHasData: vRef(false) as { value: boolean },
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
  qualificationScope: { value: {} },
  qualificationLabel: { value: '' },
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
  analysis: mockAnalysis,
  anchoredAnalysis: { value: null },
  userEntry: { value: undefined },
  hasAnchor: { value: false },
  isNewHireMode: { value: false },
  projectionEndDate: { value: null },
}))

mockNuxtImport('useStanding', () => () => ({
  rankCard: { value: { base: '--', seat: '--', fleet: '--', percentile: 0, seniorityNumber: 0, activeRank: 0, hireDate: '--' } },
  baseStatus: { value: [] },
  statCards: { value: [] },
  retirementSnapshot: { value: null },
}))

mockNuxtImport('useTrajectory', () => () => ({
  chartData: { value: { labels: [], data: [] } },
  changes: { value: [] },
  computeComparativeTrajectory: vi.fn(),
  computeRetirementProjection: vi.fn(),
}))

mockNuxtImport('useQualificationFilter', () => () => mockQualFilter)
mockNuxtImport('useDeferredReady', () => () => ({ value: true }))

describe('TrajectoryTab', () => {
  it('shows empty state when no seniority data', async () => {
    mockHasData.value = false
    mockAnalysis.value = null
    const Tab = await import('./TrajectoryTab.vue')
    const wrapper = await mountSuspended(Tab.default)
    expect(wrapper.text()).toContain('No Seniority Data')
  })

  it('shows loading skeleton when loading prop is true', async () => {
    mockHasData.value = true
    mockAnalysis.value = null
    const Tab = await import('./TrajectoryTab.vue')
    const wrapper = await mountSuspended(Tab.default, {
      props: { loading: true },
    })
    expect(wrapper.html()).toContain('skeleton')
  })

  it('renders scoped retirement-wave buckets supplied by Seniority Analysis', async () => {
    const retirementYearAnalysis = vi.fn(() => [{
      year: 2030,
      retirementCount: 6,
      isRetirementWave: true,
    }])
    mockHasData.value = true
    mockAnalysis.value = { retirementYearAnalysis }
    const Tab = await import('./TrajectoryTab.vue')
    const wrapper = await mountSuspended(Tab.default)

    expect(retirementYearAnalysis).toHaveBeenCalledWith(expect.objectContaining({ qualificationScope: {} }))
    expect(wrapper.text()).toContain('Retirement Wave')
    expect(wrapper.get('[data-testid="retirement-wave-buckets"]').text()).toBe('2030')
  })
})
