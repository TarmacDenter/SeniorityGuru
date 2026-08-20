import { describe, it, expect, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { DemographicsResult } from '~/utils/seniority-engine'
import { parsePlainDate } from '~/utils/temporal'

const { mockHasData, mockLens } = vi.hoisted(() => {
  const { ref: vRef } = require('vue')
  return {
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
  anchoredLens: { value: null },
  userEntry: { value: undefined },
  hasAnchor: { value: false },
  isNewHireMode: { value: false },
}))

mockNuxtImport('useQualFilter', () => () => ({
  selectedFleet: { value: null },
  selectedSeat: { value: null },
  selectedBase: { value: null },
  availableFleets: { value: [] },
  availableSeats: { value: [] },
  availableBases: { value: [] },
  qualSpec: { value: {} },
  qualLabel: { value: '' },
  clear: vi.fn(),
}))

mockNuxtImport('useUser', () => () => ({ retirementAge: { value: 65 } }))
mockNuxtImport('useDeferredReady', () => () => ({ value: true }))

const demographicsResult: DemographicsResult = {
  ageDistribution: { buckets: [{ label: '50–54', count: 2 }], nullCount: 0 },
  mostJuniorCAs: [{
    qualKey: '737 CA JFK', fleet: '737', seat: 'CA', base: 'JFK',
    seniorityNumber: 10, hireDate: parsePlainDate('2010-01-01'), yos: 16,
  }],
  qualComposition: [{
    qualKey: '737 CA', fleet: '737', seat: 'CA', total: 2, caCount: 2,
    foCount: 0, caFoRatio: 2, byBase: [{ base: 'JFK', count: 2, pct: 100 }],
  }],
  yosDistribution: { entryFloor: 16, p10: 16, p25: 16, median: 16, p75: 16, p90: 16, max: 16 },
  yosHistogram: [{ label: '16', minYos: 16, count: 2 }],
}

describe('DemographicsTab', () => {
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

    expect(demographics).toHaveBeenCalledWith(65, expect.any(Object))
    expect(wrapper.text()).toContain('Most Junior Captain by Qual')
    expect(wrapper.text()).toContain('Base / Fleet / Seat Sizes')
    expect(wrapper.text()).toContain('Qual Composition')
    expect(wrapper.text()).toContain('Age Distribution')
    expect(wrapper.text()).toContain('Years of Service')
  })
})
