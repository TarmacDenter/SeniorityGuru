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

vi.mock('~~/shared/schemas/seniority-list', () => ({
  SeniorityListResponseSchema: { array: () => 'SeniorityListResponseSchema[]' },
}))

vi.mock('#server/api/admin/logger', () => ({
  createAdminLogger: () => mockLogger,
}))

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */
describe('GET /api/admin/seniority/lists', () => {
  let handler: (event: unknown) => Promise<unknown>
  const fakeEvent = {} as unknown

  // Chainable mock Supabase client
  const mockClient: Record<string, ReturnType<typeof vi.fn>> = {}
  mockClient.from = vi.fn(() => mockClient)
  mockClient.select = vi.fn(() => mockClient)
  mockClient.order = vi.fn(() => mockClient)

  beforeAll(async () => {
    const mod = await import('./lists.get')
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

  it('returns seniority lists on success', async () => {
    const fakeLists = [
      { id: '1', airline_id: 'a1', effective_date: '2024-01-01', created_at: '2024-01-01' },
      { id: '2', airline_id: 'a2', effective_date: '2024-06-01', created_at: '2024-06-01' },
    ]
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.fetchAllRows.mockResolvedValueOnce(fakeLists)

    const result = await handler(fakeEvent)

    expect(mocks.requireAdmin).toHaveBeenCalledWith(fakeEvent)
    expect(mocks.serverSupabaseServiceRole).toHaveBeenCalledWith(fakeEvent)
    expect(mockClient.from).toHaveBeenCalledWith('seniority_lists')
    expect(mocks.fetchAllRows).toHaveBeenCalledWith(mockClient, 'admin/seniority/lists')
    expect(mocks.parseResponse).toHaveBeenCalledWith(
      'SeniorityListResponseSchema[]',
      fakeLists,
      'admin/seniority/lists.get',
    )
    expect(result).toEqual(fakeLists)
  })

  it('returns 502 when fetchAllRows fails', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.fetchAllRows.mockRejectedValueOnce(new Error('DB timeout'))

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to fetch seniority lists',
    })
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to fetch seniority lists',
      expect.objectContaining({ error: 'DB timeout' }),
    )
  })
})
