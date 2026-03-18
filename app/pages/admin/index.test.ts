// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const {
  mockUseFetch,
} = vi.hoisted(() => ({
  mockUseFetch: vi.fn(),
}))

mockNuxtImport('useFetch', () => mockUseFetch)

const mockStats = {
  total_users: 42,
  users_by_role: { user: 39, admin: 3 },
  total_lists: 15,
  total_entries: 8500,
  recent_signups: [
    { id: 'user-1', email: 'alice@example.com', created_at: '2026-01-15T10:00:00Z', icao_code: 'DAL' },
    { id: 'user-2', email: 'bob@example.com', created_at: '2026-01-14T09:00:00Z', icao_code: null },
  ],
}

const mockActivity = [
  {
    id: 'act-1',
    event_type: 'user_signup',
    actor_email: 'alice@example.com',
    metadata: {},
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'act-2',
    event_type: 'list_upload',
    actor_email: 'bob@example.com',
    metadata: { title: 'Jan List', airline: 'UAL' },
    created_at: '2026-01-14T09:00:00Z',
  },
]

describe('admin/index.vue', () => {
  beforeEach(() => {
    mockUseFetch.mockReset()
    mockUseFetch.mockImplementation((url: string) => {
      if (url === '/api/admin/stats') {
        return { data: ref(mockStats), pending: ref(false), error: ref(null) }
      }
      if (url === '/api/admin/activity') {
        return { data: ref(mockActivity), pending: ref(false), error: ref(null) }
      }
      return { data: ref(null), pending: ref(false), error: ref(null) }
    })
  })

  it('renders total users stat card', async () => {
    const AdminIndex = await import('./index.vue')
    const wrapper = await mountSuspended(AdminIndex.default)
    expect(wrapper.text()).toContain('42')
  })

  it('renders total lists stat', async () => {
    const AdminIndex = await import('./index.vue')
    const wrapper = await mountSuspended(AdminIndex.default)
    expect(wrapper.text()).toContain('15')
  })

  it('renders total entries stat', async () => {
    const AdminIndex = await import('./index.vue')
    const wrapper = await mountSuspended(AdminIndex.default)
    expect(wrapper.text()).toContain('8500')
  })

  it('renders activity feed with user_signup event', async () => {
    const AdminIndex = await import('./index.vue')
    const wrapper = await mountSuspended(AdminIndex.default)
    expect(wrapper.text()).toContain('alice@example.com')
    expect(wrapper.text()).toContain('New user signed up')
  })

  it('renders activity feed with list_upload event', async () => {
    const AdminIndex = await import('./index.vue')
    const wrapper = await mountSuspended(AdminIndex.default)
    expect(wrapper.text()).toContain('bob@example.com')
    expect(wrapper.text()).toContain('Uploaded a list')
  })
})
