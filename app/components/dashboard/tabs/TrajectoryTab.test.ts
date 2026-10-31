import { describe, it, expect, vi, afterEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockAnalysis, mockHasData, mockHasAnchor, mockEndedByLabel, mockAnchored } = vi.hoisted(() => {
  const { ref: vRef } = require('vue')
  return {
    mockHasAnchor: vRef(false) as { value: boolean },
    mockEndedByLabel: vRef(null) as { value: string | null },
    mockAnchored: vRef(null) as { value: { seniorityTrajectory: ReturnType<typeof vi.fn>, percentileCrossing: ReturnType<typeof vi.fn> } | null },
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

vi.mock('~/components/dashboard/TrajectoryChart.vue', () => ({
  default: {
    props: ['data', 'endedByLabel'],
    template: '<div data-testid="trajectory-chart">{{ endedByLabel }}</div>',
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
  anchoredAnalysis: mockAnchored,
  userEntry: { value: undefined },
  hasAnchor: mockHasAnchor,
  isNewHireMode: { value: false },
  projectionEndDate: { value: '2030-06-15' },
}))

const unscopedRankCard = { base: '--', seat: '--', fleet: '--', seniorityPercentile: 0, seniorityNumber: 0, publicationPosition: 0, rosterSize: 260, rank: 0, activePilotCount: 240, isSimulated: false, hireDate: '--' }
const scopedRankCard = { ...unscopedRankCard, rosterSize: 90, activePilotCount: 80 }

mockNuxtImport('useStanding', () => (qualificationScope?: unknown) => ({
  rankCard: require('vue').ref(qualificationScope ? scopedRankCard : unscopedRankCard),
  baseStatus: { value: [] },
  statCards: { value: [] },
  retirementSnapshot: { value: null },
}))

mockNuxtImport('useTrajectory', () => () => ({
  chartData: require('vue').ref({ labels: ['2026-06-15'], data: [50] }),
  endedByLabel: mockEndedByLabel,
  changes: { value: [] },
  computeComparativeTrajectory: vi.fn(),
  computeRetirementProjection: vi.fn(),
}))

mockNuxtImport('useQualificationFilter', () => () => mockQualFilter)
mockNuxtImport('useDeferredReady', () => () => ({ value: true }))

afterEach(() => {
  mockAnchored.value = null
  mockHasAnchor.value = false
  mockEndedByLabel.value = null
})

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

  it('discloses Roster Size and active pilots beside the trajectory and threshold views', async () => {
    mockHasData.value = true
    mockAnalysis.value = { retirementYearAnalysis: vi.fn(() => []) }
    const Tab = await import('./TrajectoryTab.vue')
    const wrapper = await mountSuspended(Tab.default)

    expect(wrapper.get('[data-testid="trajectory-roster-size"]').text()).toBe('Roster Size 260 · Active pilots 240')
    expect(wrapper.get('[data-testid="scoped-roster-size"]').text()).toContain('Roster Size 90 · Active pilots 80')
  })

  it('badges a Hypothetical Placement trajectory with its scope label', async () => {
    mockHasData.value = true
    mockAnalysis.value = { retirementYearAnalysis: vi.fn(() => []) }
    mockAnchored.value = {
      seniorityTrajectory: vi.fn(() => ({
        domain: { points: [], changes: [], isHypothetical: true },
        presentation: { chartData: { labels: [], data: [] }, changes: [], endedByLabel: null, hypotheticalLabel: 'Hypothetical Placement in BOS' },
      })),
      percentileCrossing: vi.fn(() => ({ domain: null, presentation: null })),
    }
    const Tab = await import('./TrajectoryTab.vue')
    const wrapper = await mountSuspended(Tab.default)

    expect(wrapper.get('[data-testid="hypothetical-placement"]').text()).toBe('Hypothetical Placement in BOS')
  })

  it('says why the scoped trajectory ends when it stops at the Anchor Pilot retirement', async () => {
    mockHasData.value = true
    mockAnalysis.value = { retirementYearAnalysis: vi.fn(() => []) }
    mockAnchored.value = {
      seniorityTrajectory: vi.fn(() => ({
        domain: { points: [], changes: [], isHypothetical: false },
        presentation: { chartData: { labels: [], data: [] }, changes: [], endedByLabel: 'Anchor Pilot retired', hypotheticalLabel: null },
      })),
      percentileCrossing: vi.fn(() => ({ domain: null, presentation: null })),
    }
    const Tab = await import('./TrajectoryTab.vue')
    const wrapper = await mountSuspended(Tab.default)

    expect(wrapper.get('[data-testid="scoped-trajectory-ended-by"]').text()).toBe('Anchor Pilot retired')
  })

  it('passes the end reason to the trajectory chart', async () => {
    mockHasData.value = true
    mockHasAnchor.value = true
    mockEndedByLabel.value = 'Anchor Pilot retired'
    mockAnalysis.value = { retirementYearAnalysis: vi.fn(() => []) }
    const Tab = await import('./TrajectoryTab.vue')
    const wrapper = await mountSuspended(Tab.default)

    expect(wrapper.get('[data-testid="trajectory-chart"]').text()).toBe('Anchor Pilot retired')
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
