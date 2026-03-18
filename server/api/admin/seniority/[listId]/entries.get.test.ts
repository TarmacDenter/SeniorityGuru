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
      validateRouteParam: vi.fn(),
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
  fetchAllRows: mocks.fetchAllRows,
  parseResponse: mocks.parseResponse,
  validateRouteParam: mocks.validateRouteParam,
})

/* Explicit module mocks */
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mocks.serverSupabaseServiceRole,
}))

vi.mock('~~/shared/schemas/seniority-list', () => ({
  SeniorityEntryResponseSchema: { array: () => 'SeniorityEntryResponseSchema[]' },
}))

vi.mock('#server/api/admin/logger', () => ({
  createAdminLogger: () => mockLogger,
}))

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */
const VALID_LIST_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

describe('GET /api/admin/seniority/[listId]/entries', () => {
  let handler: (event: unknown) => Promise<unknown>
  const fakeEvent = {} as unknown

  // Chainable mock Supabase client
  const mockClient: Record<string, ReturnType<typeof vi.fn>> = {}
  mockClient.from = vi.fn(() => mockClient)
  mockClient.select = vi.fn(() => mockClient)
  mockClient.eq = vi.fn(() => mockClient)
  mockClient.order = vi.fn(() => mockClient)

  beforeAll(async () => {
    const mod = await import('./entries.get')
    handler = mod.default
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.serverSupabaseServiceRole.mockResolvedValue(mockClient)
    mocks.validateRouteParam.mockResolvedValue({ listId: VALID_LIST_ID })
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

  it('returns 422 for invalid listId', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.validateRouteParam.mockRejectedValueOnce(
      Object.assign(new Error('Invalid listId'), { statusCode: 422 }),
    )

    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 422 })
  })

  it('returns entries on success', async () => {
    const fakeEntries = [
      {
        id: 'e1', list_id: VALID_LIST_ID, seniority_number: 1,
        employee_number: '1001', name: 'Doe, John', seat: 'CA',
        base: 'LAX', fleet: '737', hire_date: '2020-01-15', retire_date: null,
      },
      {
        id: 'e2', list_id: VALID_LIST_ID, seniority_number: 2,
        employee_number: '1002', name: 'Smith, Jane', seat: 'FO',
        base: 'ORD', fleet: '777', hire_date: '2021-06-01', retire_date: '2055-06-01',
      },
    ]
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.fetchAllRows.mockResolvedValueOnce(fakeEntries)

    const result = await handler(fakeEvent)

    expect(mocks.requireAdmin).toHaveBeenCalledWith(fakeEvent)
    expect(mocks.validateRouteParam).toHaveBeenCalledWith(
      fakeEvent,
      'listId',
      expect.anything(),
    )
    expect(mocks.serverSupabaseServiceRole).toHaveBeenCalledWith(fakeEvent)
    expect(mockClient.from).toHaveBeenCalledWith('seniority_entries')
    expect(mockClient.eq).toHaveBeenCalledWith('list_id', VALID_LIST_ID)
    expect(mocks.fetchAllRows).toHaveBeenCalledWith(
      mockClient,
      `admin/seniority/${VALID_LIST_ID}/entries`,
    )
    expect(mocks.parseResponse).toHaveBeenCalledWith(
      'SeniorityEntryResponseSchema[]',
      fakeEntries,
      'admin/seniority/[listId]/entries.get',
    )
    expect(result).toEqual(fakeEntries)
  })

  it('returns 502 when fetchAllRows fails', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.fetchAllRows.mockRejectedValueOnce(new Error('Connection refused'))

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to fetch seniority entries',
    })
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to fetch seniority entries',
      expect.objectContaining({ listId: VALID_LIST_ID, error: 'Connection refused' }),
    )
  })
})
