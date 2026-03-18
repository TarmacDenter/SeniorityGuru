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
  AdminActivityResponseSchema: 'AdminActivityResponseSchema',
}))

vi.mock('#server/api/admin/logger', () => ({
  createAdminLogger: () => mockLogger,
}))

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */
describe('GET /api/admin/activity', () => {
  let handler: (event: unknown) => Promise<unknown>
  const fakeEvent = {} as unknown

  // Chainable mock Supabase client
  const mockClient: Record<string, ReturnType<typeof vi.fn>> = {}
  mockClient.from = vi.fn(() => mockClient)
  mockClient.select = vi.fn(() => mockClient)
  mockClient.order = vi.fn(() => mockClient)
  mockClient.limit = vi.fn(() => mockClient)
  mockClient.auth = {
    admin: {
      listUsers: vi.fn(),
    },
  }

  beforeAll(async () => {
    const mod = await import('./activity.get')
    handler = mod.default
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.serverSupabaseServiceRole.mockReturnValue(mockClient)
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

  it('returns activity feed with actor emails mapped in', async () => {
    const fakeActivityRows = [
      { id: 'act-1', event_type: 'user_signup', actor_id: 'user-aaa', metadata: {}, created_at: '2024-01-01T00:00:00Z' },
      { id: 'act-2', event_type: 'list_upload', actor_id: 'user-bbb', metadata: { list_id: 'l1' }, created_at: '2024-01-02T00:00:00Z' },
      { id: 'act-3', event_type: 'list_upload', actor_id: null, metadata: {}, created_at: '2024-01-03T00:00:00Z' },
    ]
    const fakeAuthUsers = {
      users: [
        { id: 'user-aaa', email: 'alice@example.com' },
        { id: 'user-bbb', email: 'bob@example.com' },
      ],
    }

    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mockClient.limit.mockResolvedValueOnce({ data: fakeActivityRows, error: null })
    mockClient.auth.admin.listUsers.mockResolvedValueOnce({ data: fakeAuthUsers, error: null })

    const result = await handler(fakeEvent) as any[]

    expect(result).toEqual([
      { id: 'act-1', event_type: 'user_signup', actor_email: 'alice@example.com', metadata: {}, created_at: '2024-01-01T00:00:00Z' },
      { id: 'act-2', event_type: 'list_upload', actor_email: 'bob@example.com', metadata: { list_id: 'l1' }, created_at: '2024-01-02T00:00:00Z' },
      { id: 'act-3', event_type: 'list_upload', actor_email: null, metadata: {}, created_at: '2024-01-03T00:00:00Z' },
    ])
  })

  it('queries admin_activity_log ordered by created_at desc limited to 50', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mockClient.limit.mockResolvedValueOnce({ data: [], error: null })
    mockClient.auth.admin.listUsers.mockResolvedValueOnce({ data: { users: [] }, error: null })

    await handler(fakeEvent)

    expect(mockClient.from).toHaveBeenCalledWith('admin_activity_log')
    expect(mockClient.select).toHaveBeenCalledWith('*')
    expect(mockClient.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(mockClient.limit).toHaveBeenCalledWith(50)
  })

  it('returns 500 when DB query fails', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mockClient.limit.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Failed to fetch activity log',
    })
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to fetch activity log',
      expect.objectContaining({ error: 'DB error' }),
    )
  })

  it('returns 500 when listUsers fails', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mockClient.limit.mockResolvedValueOnce({ data: [], error: null })
    mockClient.auth.admin.listUsers.mockResolvedValueOnce({ data: null, error: { message: 'Auth error' } })

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Failed to fetch users',
    })
  })
})
