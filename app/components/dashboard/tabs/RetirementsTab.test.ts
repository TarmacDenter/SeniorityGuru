import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { UpcomingRetirementRow } from '~/utils/seniority-engine'
import { parsePlainDate } from '~/utils/temporal'

const mockUpcomingRetirements = vi.fn()

const { mockHasData, mockHasAnchor, mockLens, mockAnchoredLens } = vi.hoisted(() => {
  const { ref: vRef } = require('vue')
  return {
    mockHasData: vRef(false) as { value: boolean },
    mockHasAnchor: vRef(false) as { value: boolean },
    mockLens: vRef(null) as { value: { upcomingRetirements: ReturnType<typeof vi.fn> } | null },
    mockAnchoredLens: vRef(null) as { value: { upcomingRetirementsRelativeToAnchor: ReturnType<typeof vi.fn> } | null },
  }
})

const mockStoreState = { employeeNumber: null as string | null, entries: [] as unknown[] }

mockNuxtImport('useSeniorityCore', () => () => ({
  hasData: mockHasData,
  hasAnchor: mockHasAnchor,
  lens: mockLens,
  anchoredLens: mockAnchoredLens,
  get entries() { return { value: mockStoreState.entries } },
}))

mockNuxtImport('useUser', () => () => ({
  get employeeNumber() { return { value: mockStoreState.employeeNumber } },
}))

const sampleRows: UpcomingRetirementRow[] = [
  { seniorityNumber: 2, employeeNumber: 'E2', base: 'JFK', seat: 'CA', fleet: '737', retireDate: parsePlainDate('2027-06-01') },
  { seniorityNumber: 5, employeeNumber: 'E5', base: 'ATL', seat: 'FO', fleet: '320', retireDate: parsePlainDate('2028-03-15') },
]

describe('RetirementsTab', () => {
  beforeEach(() => {
    mockHasData.value = false
    mockHasAnchor.value = false
    mockLens.value = null
    mockAnchoredLens.value = null
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
    expect(wrapper.text()).toContain('Set an employee number that appears in this list')
  })
})
