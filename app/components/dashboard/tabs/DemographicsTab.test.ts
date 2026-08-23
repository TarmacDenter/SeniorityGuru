import { beforeEach, describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { SeniorityDemographics } from '~/utils/seniority'
import { parsePlainDate } from '~/utils/temporal'

const { mockAnchoredLens, mockHasData, mockLens } = vi.hoisted(() => {
  const { ref: vRef } = require('vue')
  return {
    mockAnchoredLens: vRef(null) as { value: { qualificationPositions: ReturnType<typeof vi.fn> } | null },
    mockHasData: vRef(false) as { value: boolean },
    mockLens: vRef(null) as { value: { demographics: ReturnType<typeof vi.fn> } | null },
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
  lens: mockLens,
  anchoredLens: mockAnchoredLens,
  userEntry: { value: undefined },
  hasAnchor: { value: false },
  isNewHireMode: { value: false },
}))

mockNuxtImport('useQualificationFilter', () => () => ({
  selectedFleet: { value: null },
  selectedSeat: { value: null },
  selectedBase: { value: null },
  availableFleets: { value: [] },
  availableSeats: { value: [] },
  availableBases: { value: [] },
  qualificationScope: { value: {} },
  qualificationLabel: { value: '' },
  clear: vi.fn(),
}))

mockNuxtImport('useUser', () => () => ({ retirementAge: { value: 65 } }))
mockNuxtImport('useDeferredReady', () => () => ({ value: true }))

const demographicsResult: SeniorityDemographics = {
  ageDistribution: {
    buckets: [{ minimumAge: 50, maximumAge: 54, pilotCount: 2 }],
    unknownAgePilotCount: 0,
  },
  captainQualificationThresholds: [{
    qualification: { fleet: '737', seat: 'CA', base: 'JFK' },
    seniorityNumber: 10,
    hireDate: parsePlainDate('2010-01-01'),
    yearsOfService: 16,
  }],
  qualificationComposition: [{
    fleet: '737',
    seat: 'CA',
    pilotCount: 2,
    captainCount: 2,
    firstOfficerCount: 0,
    captainToFirstOfficerRatio: 2,
    byBase: [{ base: 'JFK', pilotCount: 2, percentage: 100 }],
  }],
  yearsOfServiceDistribution: {
    entryFloor: 16,
    p10: 16,
    p25: 16,
    median: 16,
    p75: 16,
    p90: 16,
    maximum: 16,
  },
  yearsOfServiceBuckets: [{ minimumYears: 16, maximumYears: 16, pilotCount: 2 }],
}

describe('DemographicsTab', () => {
  beforeEach(() => {
    mockAnchoredLens.value = null
    mockHasData.value = false
    mockLens.value = null
  })

  it('shows empty state when no seniority data', async () => {
    mockHasData.value = false
    mockLens.value = null
    const Tab = await import('./DemographicsTab.vue')
    const wrapper = await mountSuspended(Tab.default)
    expect(wrapper.text()).toContain('No Seniority Data')
  })

  it('shows loading skeleton when loading', async () => {
    mockHasData.value = true
    mockLens.value = null
    const Tab = await import('./DemographicsTab.vue')
    const wrapper = await mountSuspended(Tab.default, {
      props: { loading: true },
    })
    // Skeleton should be visible
    expect(wrapper.find('[class*="skeleton"]').exists() || wrapper.html().includes('skeleton')).toBe(true)
  })

  it('renders organization demographics supplied by the lens', async () => {
    const demographics = vi.fn(() => demographicsResult)
    mockHasData.value = true
    mockLens.value = { demographics }
    const Tab = await import('./DemographicsTab.vue')
    const wrapper = await mountSuspended(Tab.default)

    expect(demographics).toHaveBeenCalledWith({
      mandatoryRetirementAge: 65,
      scenario: expect.objectContaining({ qualificationScope: {} }),
    })
    expect(wrapper.text()).toContain('Most Junior Captain by Qual')
    expect(wrapper.text()).toContain('Base / Fleet / Seat Sizes')
    expect(wrapper.text()).toContain('Qual Composition')
    expect(wrapper.text()).toContain('Age Distribution')
    expect(wrapper.text()).toContain('Years of Service')
  })

  it('gets modeled Holdable state from anchored engine analysis', async () => {
    const qualificationPositions = vi.fn(() => [{
      distribution: {
        qualification: { fleet: '737', seat: 'CA', base: 'JFK' },
        activePilotCount: 2,
        thresholdPercentile: 50,
        thresholdSeniorityNumber: 10,
        percentile25: 25,
        medianPercentile: 50,
        percentile75: 75,
        maximumPercentile: 100,
        percentileDensity: [],
      },
      currentPercentile: 75,
      projectedPercentile: 75,
      modeledHoldable: true,
    }])
    mockHasData.value = true
    mockLens.value = { demographics: vi.fn(() => demographicsResult) }
    mockAnchoredLens.value = { qualificationPositions }
    const Tab = await import('./DemographicsTab.vue')
    await mountSuspended(Tab.default)

    expect(qualificationPositions).toHaveBeenCalledWith({ through: expect.anything() })
  })
})
