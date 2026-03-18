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
      validateBody: vi.fn(),
      validateRouteParam: vi.fn(),
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
  validateBody: mocks.validateBody,
  validateRouteParam: mocks.validateRouteParam,
  parseResponse: mocks.parseResponse,
})

/* Explicit module mocks */
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mocks.serverSupabaseServiceRole,
}))

vi.mock('~~/shared/schemas/admin', () => ({
  TransferListBodySchema: 'TransferListBodySchema',
  TransferListResponseSchema: 'TransferListResponseSchema',
}))

vi.mock('#server/api/admin/logger', () => ({
  createAdminLogger: () => mockLogger,
}))

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */
describe('PATCH /api/admin/seniority/[listId]/transfer', () => {
  let handler: (event: unknown) => Promise<unknown>
  const fakeEvent = {} as unknown
  const fakeListId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  const fakeTargetUserId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'

  // Chainable mock client
  const mockClient: Record<string, ReturnType<typeof vi.fn>> = {}
  mockClient.from = vi.fn(() => mockClient)
  mockClient.update = vi.fn(() => mockClient)
  mockClient.eq = vi.fn(() => mockClient)
  mockClient.select = vi.fn(() => mockClient)
  mockClient.single = vi.fn()

  beforeAll(async () => {
    const mod = await import('./transfer.patch')
    handler = mod.default
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.serverSupabaseServiceRole.mockReturnValue(mockClient)
    mockClient.from.mockReturnValue(mockClient)
    mockClient.update.mockReturnValue(mockClient)
    mockClient.eq.mockReturnValue(mockClient)
    mockClient.select.mockReturnValue(mockClient)
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

  it('rejects invalid body', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.validateRouteParam.mockResolvedValueOnce({ listId: fakeListId })
    mocks.validateBody.mockRejectedValueOnce(
      Object.assign(new Error('Validation failed'), { statusCode: 422 }),
    )

    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 422 })
  })

  it('updates uploaded_by and returns the updated list', async () => {
    const fakeUpdated = { id: fakeListId, uploaded_by: fakeTargetUserId }

    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.validateRouteParam.mockResolvedValueOnce({ listId: fakeListId })
    mocks.validateBody.mockResolvedValueOnce({ targetUserId: fakeTargetUserId })
    mockClient.single.mockResolvedValueOnce({ data: fakeUpdated, error: null })

    const result = await handler(fakeEvent)

    expect(mockClient.from).toHaveBeenCalledWith('seniority_lists')
    expect(mockClient.update).toHaveBeenCalledWith({ uploaded_by: fakeTargetUserId })
    expect(mockClient.eq).toHaveBeenCalledWith('id', fakeListId)
    expect(mocks.parseResponse).toHaveBeenCalledWith(
      'TransferListResponseSchema',
      fakeUpdated,
      'admin/seniority/[listId]/transfer.patch',
    )
    expect(result).toEqual(fakeUpdated)
  })

  it('returns 500 when DB update fails', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.validateRouteParam.mockResolvedValueOnce({ listId: fakeListId })
    mocks.validateBody.mockResolvedValueOnce({ targetUserId: fakeTargetUserId })
    mockClient.single.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Failed to transfer list',
    })
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to transfer list',
      expect.objectContaining({ error: 'DB error' }),
    )
  })
})
