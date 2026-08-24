import { beforeEach, describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { PresentedSeniorityDemographics } from '~/utils/seniority'
import { parsePlainDate } from '~/utils/temporal'

const { mockAnalysis, mockAnchoredAnalysis, mockHasData } = vi.hoisted(() => {
  const { ref: vRef } = require('vue')
  return {
    mockAnalysis: vRef(null) as { value: { demographics: ReturnType<typeof vi.fn> } | null },
    mockAnchoredAnalysis: vRef(null) as { value: { demographics: ReturnType<typeof vi.fn> } | null },
    mockHasData: vRef(false) as { value: boolean },
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
  analysis: mockAnalysis,
  anchoredAnalysis: mockAnchoredAnalysis,
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

const demographicsResult = {
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

const demographicsPresentation: PresentedSeniorityDemographics = {
  ageDistribution: {
    buckets: [{ label: '50–54', count: 2 }],
    nullCount: 0,
  },
  captainQualificationThresholds: [{
    qualificationLabel: '737 CA JFK',
    fleet: '737',
    seat: 'CA',
    base: 'JFK',
    seniorityNumber: 10,
    hireDate: parsePlainDate('2010-01-01'),
    yos: 16,
    modeledHoldable: false,
  }],
  qualificationComposition: [{
    qualificationLabel: '737 CA',
    fleet: '737',
    seat: 'CA',
    total: 2,
    caCount: 2,
    foCount: 0,
    caFoRatio: 2,
    byBase: [{ base: 'JFK', count: 2, pct: 100 }],
  }],
  yearsOfServiceDistribution: {
    entryFloor: 16,
    p10: 16,
    p25: 16,
    median: 16,
    p75: 16,
    p90: 16,
    max: 16,
  },
  yearsOfServiceBuckets: [{ label: '16', minYos: 16, count: 2 }],
}

describe('DemographicsTab', () => {
  beforeEach(() => {
    mockAnalysis.value = null
    mockAnchoredAnalysis.value = null
    mockHasData.value = false
  })

  it('shows empty state when no seniority data', async () => {
    mockHasData.value = false
    mockAnalysis.value = null
    const Tab = await import('./DemographicsTab.vue')
    const wrapper = await mountSuspended(Tab.default)
    expect(wrapper.text()).toContain('No Seniority Data')
  })

  it('shows loading skeleton when loading', async () => {
    mockHasData.value = true
    mockAnalysis.value = null
    const Tab = await import('./DemographicsTab.vue')
    const wrapper = await mountSuspended(Tab.default, {
      props: { loading: true },
    })
    // Skeleton should be visible
    expect(wrapper.find('[class*="skeleton"]').exists() || wrapper.html().includes('skeleton')).toBe(true)
  })

  it('renders presentation supplied by Seniority Analysis', async () => {
    const demographics = vi.fn(() => ({ domain: demographicsResult, presentation: demographicsPresentation }))
    mockHasData.value = true
    mockAnalysis.value = { demographics }
    const Tab = await import('./DemographicsTab.vue')
    const wrapper = await mountSuspended(Tab.default)

    expect(demographics).toHaveBeenCalledWith({
      mandatoryRetirementAge: 65,
      scenario: { qualificationScope: {} },
    })
    expect(wrapper.text()).toContain('Most Junior Captain by Qual')
    expect(wrapper.text()).toContain('Base / Fleet / Seat Sizes')
    expect(wrapper.text()).toContain('Qual Composition')
    expect(wrapper.text()).toContain('Age Distribution')
    expect(wrapper.text()).toContain('Years of Service')
  })

  it('uses the completed anchored presentation for modeled Holdable state', async () => {
    const anchoredPresentation = {
      ...demographicsPresentation,
      captainQualificationThresholds: demographicsPresentation.captainQualificationThresholds.map(threshold => ({
        ...threshold,
        modeledHoldable: true,
      })),
    }
    const demographics = vi.fn(() => ({
      domain: demographicsResult,
      presentation: anchoredPresentation,
    }))
    mockHasData.value = true
    mockAnalysis.value = { demographics: vi.fn(() => ({ domain: demographicsResult, presentation: demographicsPresentation })) }
    mockAnchoredAnalysis.value = { demographics }
    const Tab = await import('./DemographicsTab.vue')
    await mountSuspended(Tab.default)

    expect(demographics).toHaveBeenCalledWith({
      mandatoryRetirementAge: 65,
      scenario: { qualificationScope: {} },
    })
  })
})
