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
      validateRouteParam: vi.fn(),
      serverSupabaseServiceRole: vi.fn(),
    },
  }
})

/* Nitro auto-imports → globals */
Object.assign(globalThis, {
  defineEventHandler: (fn: Function) => fn,
  createError: (opts: { statusCode: number; statusMessage: string }) =>
    Object.assign(new Error(opts.statusMessage), opts),
  setResponseStatus: vi.fn(),
  requireAdmin: mocks.requireAdmin,
  validateRouteParam: mocks.validateRouteParam,
})

/* Explicit module mocks */
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mocks.serverSupabaseServiceRole,
}))

vi.mock('#server/api/admin/logger', () => ({
  createAdminLogger: () => mockLogger,
}))

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */
describe('DELETE /api/admin/seniority/[listId]', () => {
  let handler: (event: unknown) => Promise<unknown>
  const fakeEvent = {} as unknown
  const fakeListId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

  // Chainable mock client
  const mockClient: Record<string, ReturnType<typeof vi.fn>> = {}
  mockClient.from = vi.fn(() => mockClient)
  mockClient.delete = vi.fn(() => mockClient)
  mockClient.eq = vi.fn(() => mockClient)

  beforeAll(async () => {
    const mod = await import('./[listId].delete')
    handler = mod.default
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.serverSupabaseServiceRole.mockReturnValue(mockClient)
    mockClient.from.mockReturnValue(mockClient)
    mockClient.delete.mockReturnValue(mockClient)
    mockClient.eq.mockReturnValue(mockClient)
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

  it('rejects invalid listId', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.validateRouteParam.mockRejectedValueOnce(
      Object.assign(new Error('Invalid listId'), { statusCode: 422 }),
    )

    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 422 })
  })

  it('deletes the list and returns null with 204 status', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.validateRouteParam.mockResolvedValueOnce({ listId: fakeListId })
    mockClient.eq.mockResolvedValueOnce({ error: null })

    const result = await handler(fakeEvent)

    expect(mockClient.from).toHaveBeenCalledWith('seniority_lists')
    expect(mockClient.delete).toHaveBeenCalled()
    expect(mockClient.eq).toHaveBeenCalledWith('id', fakeListId)
    expect(result).toBeNull()
  })

  it('returns 500 when DB delete fails', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.validateRouteParam.mockResolvedValueOnce({ listId: fakeListId })
    mockClient.eq.mockResolvedValueOnce({ error: { message: 'DB error' } })

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Failed to delete list',
    })
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to delete list',
      expect.objectContaining({ error: 'DB error' }),
    )
  })
})
