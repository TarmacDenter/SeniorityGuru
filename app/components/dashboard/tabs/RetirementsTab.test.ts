import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { UpcomingRetirementRow } from '~/utils/seniority-engine'

const mockUpcomingRetirements = vi.fn()

const { mockHasData, mockLens } = vi.hoisted(() => {
  const { ref: vRef } = require('vue')
  return {
    mockHasData: vRef(false) as { value: boolean },
    mockLens: vRef(null) as { value: { upcomingRetirements: ReturnType<typeof vi.fn> } | null },
  }
})

const mockStoreState = { employeeNumber: null as string | null, entries: [] as unknown[] }

mockNuxtImport('useSeniorityStore', () => () => ({
  get entries() { return mockStoreState.entries },
  lists: [],
}))

mockNuxtImport('useUserStore', () => () => ({
  get employeeNumber() { return mockStoreState.employeeNumber },
}))

mockNuxtImport('useSeniorityCore', () => () => ({
  hasData: mockHasData,
  lens: mockLens,
}))

const sampleRows: UpcomingRetirementRow[] = [
  { seniorityNumber: 2, employeeNumber: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retireDate: '2027-06-01', rankRelativeToMe: 48 },
  { seniorityNumber: 5, employeeNumber: 'E5', base: 'ATL', seat: 'FO', fleet: '320', retireDate: '2028-03-15', rankRelativeToMe: 45 },
]

describe('RetirementsTab', () => {
  beforeEach(() => {
    mockHasData.value = false
    mockLens.value = null
    mockStoreState.employeeNumber = null
    mockStoreState.entries = []
    mockUpcomingRetirements.mockReturnValue([])
  })

  it('shows empty state with CTA when no list is loaded', async () => {
    const Comp = await import('./RetirementsTab.vue')
    const wrapper = await mountSuspended(Comp.default)
    expect(wrapper.text()).toContain('No seniority list loaded')
    expect(wrapper.find('a[href="/seniority/upload"]').exists()).toBe(true)
  })

  it('renders table rows when data is available', async () => {
    mockHasData.value = true
    mockLens.value = { upcomingRetirements: mockUpcomingRetirements }
    mockUpcomingRetirements.mockReturnValue(sampleRows)
    const Comp = await import('./RetirementsTab.vue')
    const wrapper = await mountSuspended(Comp.default)
    expect(wrapper.text()).toContain('2027-06-01')
    expect(wrapper.text()).toContain('2028-03-15')
  })

  it('calls upcomingRetirements with default yearsHorizon of 2', async () => {
    mockHasData.value = true
    mockLens.value = { upcomingRetirements: mockUpcomingRetirements }
    mockUpcomingRetirements.mockReturnValue([])
    const Comp = await import('./RetirementsTab.vue')
    await mountSuspended(Comp.default)
    expect(mockUpcomingRetirements).toHaveBeenCalledWith(
      expect.objectContaining({ yearsHorizon: 2 }),
    )
  })

  it('shows employee number prompt when no employee number is set', async () => {
    mockHasData.value = true
    mockLens.value = { upcomingRetirements: mockUpcomingRetirements }
    mockStoreState.employeeNumber = null
    const Comp = await import('./RetirementsTab.vue')
    const wrapper = await mountSuspended(Comp.default)
    expect(wrapper.text()).toContain('Set your employee number')
  })
})
