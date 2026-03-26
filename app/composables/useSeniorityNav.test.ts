import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>()
  return {
    ...actual,
    useMediaQuery: () => ({ value: false }), // non-mobile by default
    useLocalStorage: () => ({ value: '' }),
  }
})

vi.mock('~/composables/useDashboardTabs', () => ({
  useDashboardTabs: () => ({ activeTab: { value: 'status' }, tabs: [] }),
  DASHBOARD_TABS: [],
}))

// Mock Nuxt composables used by useSeniorityNav
mockNuxtImport('useRoute', () => () => ({ path: '/', query: {} }))
mockNuxtImport('useState', () => (_key: string, init?: () => unknown) => ({ value: init?.() }))

describe('useSeniorityNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns navigation items including Dashboard, My Lists, Upload, Compare, What\'s New, Settings', async () => {
    const { useSeniorityNav } = await import('./useSeniorityNav')
    const nav = useSeniorityNav()
    const items = nav.value
    const labels = items.map((i) => i.label)
    expect(labels).toContain('Dashboard')
    expect(labels).toContain('My Lists')
    expect(labels).toContain('Upload')
    expect(labels).toContain('Compare')
    expect(labels).toContain("What's New")
    expect(labels).toContain('Settings')
  })

  it('does not include an Admin item', async () => {
    const { useSeniorityNav } = await import('./useSeniorityNav')
    const nav = useSeniorityNav()
    const items = nav.value
    const adminItem = items.find((i) => i.label === 'Admin')
    expect(adminItem).toBeUndefined()
  })

  it('returns 6 top-level items', async () => {
    const { useSeniorityNav } = await import('./useSeniorityNav')
    const nav = useSeniorityNav()
    expect(nav.value).toHaveLength(6)
  })
})
