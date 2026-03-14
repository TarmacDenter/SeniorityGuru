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
      fetchAllRows: vi.fn(),
      parseResponse: vi.fn((_s: unknown, data: unknown) => data),
      serverSupabaseServiceRole: vi.fn(),
    },
  }
})

/* Nitro auto-imports → globals */
Object.assign(globalThis, {
  defineEventHandler: (fn: Function) => fn,
  createError: (opts: { statusCode: number; statusMessage: string }) =>
    Object.assign(new Error(opts.statusMessage), opts),
  requireAdmin: mocks.requireAdmin,
  fetchAllRows: mocks.fetchAllRows,
  parseResponse: mocks.parseResponse,
})

/* Explicit module mocks */
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mocks.serverSupabaseServiceRole,
}))

vi.mock('~~/shared/schemas/admin', () => ({
  AdminGetUsersSeniorityListCountResponse: 'AdminGetUsersSeniorityListCountResponse',
}))

vi.mock('#server/api/admin/logger', () => ({
  createAdminLogger: () => mockLogger,
}))

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */
describe('GET /api/admin/seniority/upload_count', () => {
  let handler: (event: unknown) => Promise<unknown>
  const fakeEvent = {} as unknown

  const mockClient: Record<string, ReturnType<typeof vi.fn>> = {}
  mockClient.from = vi.fn(() => mockClient)
  mockClient.select = vi.fn(() => mockClient)

  beforeAll(async () => {
    const mod = await import('./upload_count.get')
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

  it('maps snake_case view columns to camelCase DTOs', async () => {
    const viewRows = [
      { user_id: 'aaa-111', count: 3 },
      { user_id: 'bbb-222', count: 7 },
    ]
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.fetchAllRows.mockResolvedValueOnce(viewRows)

    const result = await handler(fakeEvent)

    expect(result).toEqual([
      { userId: 'aaa-111', count: 3 },
      { userId: 'bbb-222', count: 7 },
    ])
  })

  it('queries the user_count_uploads view', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.fetchAllRows.mockResolvedValueOnce([])

    await handler(fakeEvent)

    expect(mocks.serverSupabaseServiceRole).toHaveBeenCalledWith(fakeEvent)
    expect(mockClient.from).toHaveBeenCalledWith('user_count_uploads')
    expect(mocks.fetchAllRows).toHaveBeenCalledWith(mockClient, 'admin/seniority/upload_count')
    expect(mocks.parseResponse).toHaveBeenCalledWith(
      'AdminGetUsersSeniorityListCountResponse',
      [],
      'admin/seniority/upload_count.get',
    )
  })

  it('returns 502 when fetchAllRows fails', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.fetchAllRows.mockRejectedValueOnce(new Error('DB timeout'))

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to fetch user count uploads',
    })
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to fetch user count uploads',
      expect.objectContaining({ error: 'DB timeout' }),
    )
  })
})
