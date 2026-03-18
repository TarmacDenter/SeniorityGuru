// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockUseFetch, mockNavigateTo, mockRouteParams, mockFetch } = vi.hoisted(() => ({
  mockUseFetch: vi.fn(),
  mockNavigateTo: vi.fn(),
  mockRouteParams: { value: { id: 'user-abc' } },
  mockFetch: vi.fn(),
}))

mockNuxtImport('useFetch', () => mockUseFetch)
mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useRoute', () => () => ({
  params: mockRouteParams.value,
  query: {},
  path: '/admin/users/user-abc',
}))
mockNuxtImport('useAirlineOptions', () => () => ({
  options: ref([{ label: 'Delta Air Lines (DAL)', value: 'DAL' }]),
  loading: ref(false),
  load: vi.fn(),
}))

const mockUser = {
  id: 'user-abc',
  email: 'alice@example.com',
  created_at: '2026-01-01T00:00:00Z',
  last_sign_in_at: '2026-01-10T08:00:00Z',
  role: 'user',
  icao_code: 'DAL',
  employee_number: '12345',
  mandatory_retirement_age: 65,
}

const mockLists = [
  {
    id: 'list-1',
    airline: 'DAL',
    title: 'Jan 2026',
    effective_date: '2026-01-01',
    created_at: '2026-01-02T00:00:00Z',
    uploaded_by: 'user-abc',
  },
  {
    id: 'list-2',
    airline: 'UAL',
    title: 'Feb 2026',
    effective_date: '2026-02-01',
    created_at: '2026-02-02T00:00:00Z',
    uploaded_by: 'other-user',
  },
]

describe('admin/users/[id].vue', () => {
  beforeEach(() => {
    mockUseFetch.mockReset()
    mockNavigateTo.mockReset()
    mockFetch.mockReset()
    vi.stubGlobal('$fetch', mockFetch)

    mockUseFetch.mockImplementation((url: string) => {
      if (url === '/api/admin/users/user-abc') {
        return { data: ref(mockUser), pending: ref(false), error: ref(null) }
      }
      if (url === '/api/admin/seniority/lists') {
        return { data: ref(mockLists), pending: ref(false), error: ref(null) }
      }
      return { data: ref(null), pending: ref(false), error: ref(null) }
    })
  })

  it('renders the user profile section with email', async () => {
    const UserDetailPage = await import('./[id].vue')
    const wrapper = await mountSuspended(UserDetailPage.default)
    expect(wrapper.text()).toContain('alice@example.com')
  })

  it('renders the user role', async () => {
    const UserDetailPage = await import('./[id].vue')
    const wrapper = await mountSuspended(UserDetailPage.default)
    expect(wrapper.text()).toContain('user')
  })

  it('renders only lists belonging to this user', async () => {
    const UserDetailPage = await import('./[id].vue')
    const wrapper = await mountSuspended(UserDetailPage.default)
    expect(wrapper.text()).toContain('Jan 2026')
    // list-2 belongs to 'other-user', should not appear
    expect(wrapper.text()).not.toContain('Feb 2026')
  })

  it('shows delete confirm modal when confirmDelete is called', async () => {
    const UserDetailPage = await import('./[id].vue')
    const wrapper = await mountSuspended(UserDetailPage.default)
    const vm = wrapper.vm as unknown as { confirmDelete: () => void; deleteOpen: boolean }
    vm.confirmDelete()
    await nextTick()
    expect(vm.deleteOpen).toBe(true)
  })

  it('renders an "Edit Profile" button in the Profile Card', async () => {
    const UserDetailPage = await import('./[id].vue')
    const wrapper = await mountSuspended(UserDetailPage.default)
    expect(wrapper.text()).toContain('Edit Profile')
  })

  it('saveProfile calls PATCH endpoint with the provided fields', async () => {
    mockFetch.mockResolvedValueOnce({
      id: 'user-abc',
      icao_code: 'UAL',
      employee_number: '12345',
      mandatory_retirement_age: 65,
    })

    const UserDetailPage = await import('./[id].vue')
    const wrapper = await mountSuspended(UserDetailPage.default)
    const vm = wrapper.vm as unknown as { saveProfile: (p: Record<string, unknown>) => Promise<void> }

    await vm.saveProfile({ icaoCode: 'UAL' })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/users/user-abc/profile',
      expect.objectContaining({ method: 'PATCH', body: { icaoCode: 'UAL' } }),
    )
  })

  it('saveProfile patches local user ref on success', async () => {
    mockFetch.mockResolvedValueOnce({
      id: 'user-abc',
      icao_code: 'UAL',
      employee_number: '99',
      mandatory_retirement_age: 60,
    })

    const UserDetailPage = await import('./[id].vue')
    const wrapper = await mountSuspended(UserDetailPage.default)
    const vm = wrapper.vm as unknown as {
      saveProfile: (p: Record<string, unknown>) => Promise<void>
    }

    await vm.saveProfile({ icaoCode: 'UAL', employeeNumber: '99', mandatoryRetirementAge: 60 })
    await nextTick()

    expect(wrapper.text()).toContain('UAL')
  })
})
