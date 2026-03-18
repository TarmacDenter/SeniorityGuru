// @vitest-environment node
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

/* ------------------------------------------------------------------ */
/*  Mocks — hoisted so they exist before the handler module loads     */
/* ------------------------------------------------------------------ */
const { mocks, mockLogger } = vi.hoisted(() => {
  const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  return {
    mockLogger: logger,
    mocks: {
      requireAdmin: vi.fn(),
      parseResponse: vi.fn((_s: unknown, data: unknown) => data),
      serverSupabaseServiceRole: vi.fn(),
    },
  }
})

/* Nitro auto-imports → globals */
Object.assign(globalThis, {
  defineEventHandler: (fn: (...args: unknown[]) => unknown) => fn,
  createError: (opts: { statusCode: number; statusMessage: string }) =>
    Object.assign(new Error(opts.statusMessage), opts),
  requireAdmin: mocks.requireAdmin,
  parseResponse: mocks.parseResponse,
})

/* Explicit module mocks */
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mocks.serverSupabaseServiceRole,
}))

vi.mock('~~/shared/schemas/admin', () => ({
  AdminStatsResponseSchema: 'AdminStatsResponseSchema',
}))

vi.mock('#server/api/admin/logger', () => ({
  createAdminLogger: () => mockLogger,
}))

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */
describe('GET /api/admin/stats', () => {
  let handler: (event: unknown) => Promise<unknown>
  const fakeEvent = {} as unknown

  // Build chainable mock client with methods used by the route
  const mockQueryResult: Record<string, ReturnType<typeof vi.fn>> = {}
  mockQueryResult.select = vi.fn(() => mockQueryResult)
  mockQueryResult.eq = vi.fn(() => mockQueryResult)
  mockQueryResult.order = vi.fn(() => mockQueryResult)
  mockQueryResult.limit = vi.fn(() => Promise.resolve({ data: [], error: null }))

  const mockClient: Record<string, ReturnType<typeof vi.fn>> = {}
  mockClient.from = vi.fn(() => mockQueryResult)
  mockClient.auth = {
    admin: {
      listUsers: vi.fn(),
    },
  }

  beforeAll(async () => {
    const mod = await import('./stats.get')
    handler = mod.default
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.serverSupabaseServiceRole.mockReturnValue(mockClient)
    // Restore mockQueryResult chain after clearAllMocks
    mockQueryResult.select.mockReturnValue(mockQueryResult)
    mockQueryResult.eq.mockReturnValue(mockQueryResult)
    mockQueryResult.order.mockReturnValue(mockQueryResult)
    mockQueryResult.limit.mockResolvedValue({ data: [], error: null })
  })

  it('rejects unauthenticated requests', async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      Object.assign(new Error('Unauthorized'), { statusCode: 401 }),
    )

    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('rejects non-admin users', async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      Object.assign(new Error('Forbidden'), { statusCode: 403 }),
    )

    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns stats with counts and recent signups', async () => {
    const fakeProfiles = [
      { id: 'u1', role: 'user', icao_code: 'UAL', created_at: '2024-01-01T00:00:00Z' },
      { id: 'u2', role: 'admin', icao_code: null, created_at: '2024-02-01T00:00:00Z' },
      { id: 'u3', role: 'user', icao_code: 'DAL', created_at: '2024-03-01T00:00:00Z' },
    ]
    const fakeListsCount = [{ count: 5 }]
    const fakeEntriesCount = [{ count: 500 }]
    const fakeAuthUsers = {
      users: [
        { id: 'u1', email: 'alice@example.com' },
        { id: 'u2', email: 'bob@example.com' },
        { id: 'u3', email: 'carol@example.com' },
      ],
    }

    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    // profiles query
    mockQueryResult.select
      .mockReturnValueOnce({ data: fakeProfiles, error: null }) // profiles full
      .mockReturnValueOnce(mockQueryResult) // seniority_lists count chain
      .mockReturnValueOnce(mockQueryResult) // seniority_entries count chain
    mockQueryResult.limit
      .mockResolvedValueOnce({ data: fakeListsCount, error: null })
      .mockResolvedValueOnce({ data: fakeEntriesCount, error: null })
    mockClient.auth.admin.listUsers.mockResolvedValueOnce({ data: fakeAuthUsers, error: null })

    const result = await handler(fakeEvent) as any

    expect(result.total_users).toBe(3)
    expect(result.users_by_role).toEqual({ user: 2, admin: 1 })
    expect(result.total_lists).toBe(5)
    expect(result.total_entries).toBe(500)
    expect(result.recent_signups).toHaveLength(3)
    expect(result.recent_signups[0]).toMatchObject({
      id: 'u1',
      email: 'alice@example.com',
      icao_code: 'UAL',
    })
  })

  it('returns 500 when profiles query fails', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mockQueryResult.select.mockReturnValueOnce({ data: null, error: { message: 'DB error' } })
    mockClient.auth.admin.listUsers.mockResolvedValueOnce({ data: { users: [] }, error: null })
    mockQueryResult.limit
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Failed to fetch stats',
    })
  })

  it('returns 500 when listUsers fails', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mockQueryResult.select.mockReturnValueOnce({ data: [], error: null })
    mockClient.auth.admin.listUsers.mockResolvedValueOnce({ data: null, error: { message: 'Auth error' } })
    mockQueryResult.limit
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Failed to fetch stats',
    })
  })
})
