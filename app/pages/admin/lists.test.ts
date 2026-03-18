// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockUseFetch, mockNavigateTo } = vi.hoisted(() => ({
  mockUseFetch: vi.fn(),
  mockNavigateTo: vi.fn(),
}))

mockNuxtImport('useFetch', () => mockUseFetch)
mockNuxtImport('navigateTo', () => mockNavigateTo)

const mockLists = [
  {
    id: 'list-1',
    airline: 'DAL',
    title: 'Jan 2026',
    effective_date: '2026-01-01',
    created_at: '2026-01-02T00:00:00Z',
    uploaded_by: 'user-1',
  },
  {
    id: 'list-2',
    airline: 'UAL',
    title: null,
    effective_date: '2026-02-01',
    created_at: '2026-02-02T00:00:00Z',
    uploaded_by: 'user-2',
  },
]

const mockUsers = [
  { id: 'user-1', email: 'alice@example.com', role: 'user', icao_code: 'DAL', employee_number: '12345', created_at: '2026-01-01T00:00:00Z', last_sign_in_at: null },
  { id: 'user-2', email: 'bob@example.com', role: 'admin', icao_code: 'UAL', employee_number: '67890', created_at: '2026-01-01T00:00:00Z', last_sign_in_at: null },
]

describe('admin/lists.vue', () => {
  beforeEach(() => {
    mockUseFetch.mockReset()
    mockNavigateTo.mockReset()
    mockUseFetch.mockImplementation((url: string) => {
      if (url === '/api/admin/seniority/lists') {
        return { data: ref(mockLists), pending: ref(false), error: ref(null) }
      }
      if (url === '/api/admin/users') {
        return { data: ref(mockUsers), pending: ref(false), error: ref(null) }
      }
      return { data: ref(null), pending: ref(false), error: ref(null) }
    })
  })

  it('renders the lists table with list data', async () => {
    const ListsPage = await import('./lists.vue')
    const wrapper = await mountSuspended(ListsPage.default)
    expect(wrapper.text()).toContain('Jan 2026')
    expect(wrapper.text()).toContain('DAL')
  })

  it('shows owner email joined from users', async () => {
    const ListsPage = await import('./lists.vue')
    const wrapper = await mountSuspended(ListsPage.default)
    expect(wrapper.text()).toContain('alice@example.com')
  })

  it('shows delete confirm modal when confirmDelete is called', async () => {
    const ListsPage = await import('./lists.vue')
    const wrapper = await mountSuspended(ListsPage.default)

    // Directly invoke the confirmDelete method via the exposed vm
    const vm = wrapper.vm as unknown as {
      confirmDelete: (list: { id: string; title: string | null; airline: string; effective_date: string; created_at: string; uploaded_by: string; owner_email: string | null }) => void
      deleteOpen: boolean
    }
    vm.confirmDelete({ id: 'list-1', title: 'Jan 2026', airline: 'DAL', effective_date: '2026-01-01', created_at: '2026-01-02T00:00:00Z', uploaded_by: 'user-1', owner_email: 'alice@example.com' })
    await nextTick()

    // deleteOpen should be true
    expect(vm.deleteOpen).toBe(true)
  })
})
