import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockIsAdmin, mockProfile } = vi.hoisted(() => ({
  mockIsAdmin: { value: false },
  mockProfile: { value: null as { role: string } | null },
}))

vi.mock('~/stores/user', () => ({
  useUserStore: () => ({
    get isAdmin() { return mockIsAdmin.value },
    get profile() { return mockProfile.value },
  }),
}))

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>()
  return {
    ...actual,
    useMediaQuery: () => ({ value: false }), // non-mobile by default
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
    mockIsAdmin.value = false
    mockProfile.value = null
  })

  it('non-admin users do not see any Admin item', async () => {
    mockIsAdmin.value = false
    const { useSeniorityNav } = await import('./useSeniorityNav')
    const nav = useSeniorityNav()
    const items = nav.value
    const adminItem = items.find((i) => i.label === 'Admin')
    expect(adminItem).toBeUndefined()
  })

  it('admin users see an Admin group with 3 children', async () => {
    mockIsAdmin.value = true
    const { useSeniorityNav } = await import('./useSeniorityNav')
    const nav = useSeniorityNav()
    const items = nav.value
    const adminItem = items.find((i) => i.label === 'Admin')
    expect(adminItem).toBeDefined()
    expect(adminItem?.children).toHaveLength(3)
  })

  it('admin children have correct routes', async () => {
    mockIsAdmin.value = true
    const { useSeniorityNav } = await import('./useSeniorityNav')
    const nav = useSeniorityNav()
    const items = nav.value
    const adminItem = items.find((i) => i.label === 'Admin')
    const routes = adminItem?.children?.map((c) => (c as unknown as { to?: string }).to)
    expect(routes).toContain('/admin')
    expect(routes).toContain('/admin/users')
    expect(routes).toContain('/admin/lists')
  })

  it('admin children labels are correct', async () => {
    mockIsAdmin.value = true
    const { useSeniorityNav } = await import('./useSeniorityNav')
    const nav = useSeniorityNav()
    const items = nav.value
    const adminItem = items.find((i) => i.label === 'Admin')
    const labels = adminItem?.children?.map((c) => (c as unknown as { label?: string }).label)
    expect(labels).toEqual(['Overview', 'Users', 'Lists'])
  })
})
