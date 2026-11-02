// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockNavigateTo, mockRoute } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
  mockRoute: { path: '/dashboard', query: {} as Record<string, string>, params: {} as Record<string, unknown> },
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useRoute', () => () => mockRoute)

async function visit(page: Promise<{ default: object }>, route: Partial<typeof mockRoute>) {
  Object.assign(mockRoute, { path: '/', query: {}, params: {} }, route)
  await mountSuspended((await page).default)
  return mockNavigateTo.mock.calls.at(-1)
}

beforeEach(() => {
  mockNavigateTo.mockReset()
})

describe('old /dashboard links', () => {
  it.each([
    ['now', '/dashboard/current/status'],
    ['next', '/dashboard/trajectory/projection'],
    ['qualifications', '/dashboard/current/holdability'],
    ['lists', '/dashboard/list/full'],
    ['status', '/dashboard/current/status'],
    ['overview', '/dashboard/current/status'],
    ['trajectory', '/dashboard/trajectory/projection'],
    ['projections', '/dashboard/trajectory/projection'],
    ['position', '/dashboard/current/holdability'],
    ['demographics', '/dashboard/demographics'],
    ['seniority', '/dashboard/list/full'],
    ['retirements', '/dashboard/list/retirements'],
    ['nonsense', '/dashboard/current/status'],
  ])('/dashboard?tab=%s opens %s', async (tab, path) => {
    const call = await visit(import('./index.vue'), { path: '/dashboard', query: { tab } })
    expect(call).toEqual([{ path, query: {} }, { replace: true }])
  })

  it('/dashboard opens Current › Status and keeps the chosen list', async () => {
    const call = await visit(import('./index.vue'), { path: '/dashboard', query: { list: '7' } })
    expect(call).toEqual([{ path: '/dashboard/current/status', query: { list: '7' } }, { replace: true }])
  })

  it.each([
    [['current'], '/dashboard/current/status'],
    [['trajectory'], '/dashboard/trajectory/projection'],
    [['list'], '/dashboard/list/full'],
    [['nonsense'], '/dashboard/current/status'],
    [['current', 'nonsense'], '/dashboard/current/status'],
  ])('/dashboard/%s opens %s', async (slug, path) => {
    const call = await visit(import('./[...slug].vue'), { path: `/dashboard/${slug.join('/')}`, params: { slug }, query: { list: '3' } })
    expect(call).toEqual([{ path, query: { list: '3' } }, { replace: true }])
  })
})

describe('old list pages', () => {
  it('/seniority opens List › Full list', async () => {
    const call = await visit(import('../seniority/index.vue'), { path: '/seniority' })
    expect(call).toEqual([{ path: '/dashboard/list/full', query: {} }, { replace: true }])
  })

  it('My Lists opens List › Uploads', async () => {
    const call = await visit(import('../seniority/lists.vue'), { path: '/seniority/lists' })
    expect(call).toEqual([{ path: '/dashboard/list/uploads', query: {} }, { replace: true }])
  })

  it('Compare opens List › Compare with the same two lists', async () => {
    const call = await visit(import('../seniority/compare.vue'), { path: '/seniority/compare', query: { a: '1', b: '2' } })
    expect(call).toEqual([{ path: '/dashboard/list/compare', query: { a: '1', b: '2' } }, { replace: true }])
  })
})
