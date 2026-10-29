import { nextTick } from 'vue'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { PresentedSeniorityDemographics } from '~/utils/seniority'
import { parsePlainDate } from '~/utils/temporal'

const { mockAnalysis, mockAnchoredAnalysis, mockHasData, mockReady, mockRetirementAge, mockSelectedBase, mockQualificationScope } = vi.hoisted(() => {
  const { ref: vRef, computed: vComputed } = require('vue')
  const mockSelectedBase = vRef(null)
  const mockQualificationScope = vComputed(() => mockSelectedBase.value ? { base: mockSelectedBase.value } : {})
  return {
    mockAnalysis: vRef(null) as { value: { demographics: ReturnType<typeof vi.fn> } | null },
    mockAnchoredAnalysis: vRef(null) as { value: { demographics: ReturnType<typeof vi.fn> } | null },
    mockHasData: vRef(false) as { value: boolean },
    mockReady: vRef(true) as { value: boolean },
    mockRetirementAge: vRef(65) as { value: number },
    mockSelectedBase,
    mockQualificationScope,
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
  selectedBase: mockSelectedBase,
  availableFleets: { value: [] },
  availableSeats: { value: [] },
  availableBases: { value: ['JFK', 'NO-MATCH'] },
  qualificationScope: mockQualificationScope,
  qualificationLabel: { value: '' },
  clear: vi.fn(),
}))

mockNuxtImport('useUser', () => () => ({ retirementAge: mockRetirementAge }))
mockNuxtImport('useDeferredReady', () => () => mockReady)

vi.mock('vue-chartjs', () => ({ Bar: { template: '<div />' } }))

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
    mockReady.value = true
    mockRetirementAge.value = 65
    mockSelectedBase.value = null
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
    expect(wrapper.text()).not.toContain('Age derived using')
    expect(wrapper.html()).not.toContain('animate-pulse')
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

  it('shows completed zero matches and restores charts when the filter clears', async () => {
    mockHasData.value = true
    mockSelectedBase.value = 'NO-MATCH'
    mockAnalysis.value = { demographics: vi.fn(({ scenario }) => ({
      domain: demographicsResult,
      presentation: scenario.qualificationScope.base ? {
        ...demographicsPresentation,
        qualificationComposition: [],
        captainQualificationThresholds: [],
        ageDistribution: { buckets: [{ label: '50–54', count: 0 }], nullCount: 0 },
        yearsOfServiceBuckets: [],
      } : demographicsPresentation,
    })) }
    const Tab = await import('./DemographicsTab.vue')
    const wrapper = await mountSuspended(Tab.default)

    expect(wrapper.text()).toContain('No matching pilots')
    expect(wrapper.text()).not.toContain('Age Distribution')
    expect(wrapper.html()).not.toContain('animate-pulse')

    const clearButton = wrapper.findAll('button').find(button => button.text() === 'Clear filter')!
    await clearButton.trigger('click')

    expect(wrapper.text()).not.toContain('No matching pilots')
    expect(wrapper.text()).toContain('Qual Composition')
    expect(wrapper.text()).toContain('Age Distribution')
    expect(wrapper.text()).toContain('Years of Service')
    expect(wrapper.html()).not.toContain('animate-pulse')
  })

  it('shows no captains alongside populated FO demographics', async () => {
    mockHasData.value = true
    const presentation = {
      ...demographicsPresentation,
      captainQualificationThresholds: [],
      qualificationComposition: [{
        ...demographicsPresentation.qualificationComposition[0]!,
        qualificationLabel: '737 FO',
        seat: 'FO',
        caCount: 0,
        foCount: 2,
        caFoRatio: 0,
      }],
    }
    mockAnalysis.value = { demographics: vi.fn(() => ({ domain: demographicsResult, presentation })) }
    const Tab = await import('./DemographicsTab.vue')
    const wrapper = await mountSuspended(Tab.default)

    expect(wrapper.text()).toContain('No captains in this scope')
    expect(wrapper.text()).toContain('737 FO')
    expect(wrapper.text()).toContain('Age Distribution')
    expect(wrapper.text()).toContain('Years of Service')
    expect(wrapper.text()).not.toContain('No matching pilots')
    expect(wrapper.html()).not.toContain('animate-pulse')
  })

  it('shows the configured retirement age and excluded count from the completed result reactively', async () => {
    mockHasData.value = true
    mockRetirementAge.value = 67
    const presentation = {
      ...demographicsPresentation,
      ageDistribution: { buckets: [{ label: '50–54', count: 1 }], nullCount: 1 },
    }
    const demographics = vi.fn(() => ({ domain: demographicsResult, presentation }))
    mockAnalysis.value = { demographics }
    const Tab = await import('./DemographicsTab.vue')
    const wrapper = await mountSuspended(Tab.default)

    expect(wrapper.text()).toContain('1 pilot excluded (no retirement date on file)')
    expect(wrapper.text()).toContain('mandatory retirement age of 67')
    expect(wrapper.text()).not.toContain('Age data unavailable')
    expect(wrapper.html()).not.toContain('animate-pulse')

    mockRetirementAge.value = 68
    await nextTick()

    expect(demographics).toHaveBeenLastCalledWith({
      mandatoryRetirementAge: 68,
      scenario: { qualificationScope: {} },
    })
    expect(wrapper.text()).toContain('mandatory retirement age of 68')
    expect(wrapper.text()).not.toContain('mandatory retirement age of 67')
    expect(wrapper.text()).toContain('1 pilot excluded (no retirement date on file)')
  })

  it('distinguishes all unknown ages from zero matching pilots', async () => {
    mockHasData.value = true
    mockRetirementAge.value = 67
    const presentation = {
      ...demographicsPresentation,
      ageDistribution: { buckets: [{ label: '50–54', count: 0 }], nullCount: 2 },
    }
    mockAnalysis.value = { demographics: vi.fn(() => ({ domain: demographicsResult, presentation })) }
    const Tab = await import('./DemographicsTab.vue')
    const wrapper = await mountSuspended(Tab.default)

    expect(wrapper.text()).toContain('Age data unavailable')
    expect(wrapper.text()).toContain('2 pilots excluded (no retirement date on file)')
    expect(wrapper.text()).toContain('mandatory retirement age of 67')
    expect(wrapper.text()).toContain('Qual Composition')
    expect(wrapper.text()).toContain('Years of Service')
    expect(wrapper.text()).not.toContain('No matching pilots')
    expect(wrapper.html()).not.toContain('animate-pulse')
  })

  it('keeps loading placeholders until deferred rendering is ready', async () => {
    mockHasData.value = true
    mockReady.value = false
    const presentation = {
      ...demographicsPresentation,
      qualificationComposition: [],
      captainQualificationThresholds: [],
      ageDistribution: { buckets: [{ label: '50–54', count: 0 }], nullCount: 0 },
      yearsOfServiceBuckets: [],
    }
    mockAnalysis.value = { demographics: vi.fn(() => ({ domain: demographicsResult, presentation })) }
    const Tab = await import('./DemographicsTab.vue')
    const wrapper = await mountSuspended(Tab.default)

    expect(wrapper.html()).toContain('animate-pulse')
    expect(wrapper.text()).not.toContain('No matching pilots')

    mockReady.value = true
    await nextTick()

    expect(wrapper.text()).toContain('No matching pilots')
    expect(wrapper.html()).not.toContain('animate-pulse')
  })

  it('keeps loading placeholders while analysis is pending', async () => {
    mockHasData.value = true
    const Tab = await import('./DemographicsTab.vue')
    const wrapper = await mountSuspended(Tab.default)

    expect(wrapper.html()).toContain('animate-pulse')
    expect(wrapper.text()).not.toContain('No matching pilots')

    mockAnalysis.value = { demographics: vi.fn(() => ({ domain: demographicsResult, presentation: demographicsPresentation })) }
    await nextTick()

    expect(wrapper.text()).toContain('Age Distribution')
    expect(wrapper.html()).not.toContain('animate-pulse')
  })
})
