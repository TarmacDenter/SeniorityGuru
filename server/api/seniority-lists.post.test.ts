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
      serverSupabaseUser: vi.fn(),
      serverSupabaseClient: vi.fn(),
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
})

/* Explicit module mocks */
vi.mock('#supabase/server', () => ({
  serverSupabaseUser: mocks.serverSupabaseUser,
  serverSupabaseClient: mocks.serverSupabaseClient,
  serverSupabaseServiceRole: mocks.serverSupabaseServiceRole,
}))

vi.mock('#shared/schemas/seniority-list', () => ({
  CreateSeniorityListSchema: 'CreateSeniorityListSchema',
  CreateSeniorityListResponseSchema: 'CreateSeniorityListResponseSchema',
}))

vi.mock('#shared/utils/logger', () => ({
  createLogger: () => mockLogger,
}))

vi.mock('../utils/validation', () => ({
  parseResponse: vi.fn((_s: unknown, data: unknown) => data),
}))

/* ------------------------------------------------------------------ */
/*  Test helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Build a mock Supabase client that supports:
 * - profiles: .from('profiles').select().eq().single() → profileResult
 * - seniority_lists insert: .from('seniority_lists').insert().select().single() → listResult
 * - seniority_entries insert: .from('seniority_entries').insert() → entriesResult
 */
function makeClient(
  profileResult: unknown,
  listResult: unknown,
  entriesResult: unknown,
) {
  const profileChain = { select: vi.fn(), eq: vi.fn(), single: vi.fn() }
  profileChain.select.mockReturnValue(profileChain)
  profileChain.eq.mockReturnValue(profileChain)
  profileChain.single.mockResolvedValue(profileResult)

  const listChain = { insert: vi.fn(), select: vi.fn(), single: vi.fn() }
  listChain.insert.mockReturnValue(listChain)
  listChain.select.mockReturnValue(listChain)
  listChain.single.mockResolvedValue(listResult)

  const entriesChain = { insert: vi.fn() }
  entriesChain.insert.mockResolvedValue(entriesResult)

  const client = {
    from: vi.fn((table: string) => {
      if (table === 'profiles') return profileChain
      if (table === 'seniority_lists') return listChain
      if (table === 'seniority_entries') return entriesChain
      return profileChain
    }),
    _profileChain: profileChain,
    _listChain: listChain,
    _entriesChain: entriesChain,
  }
  return client
}

const fakeEntries = [
  {
    seniority_number: 1,
    employee_number: 'E001',
    seat: 'CA',
    base: 'LAX',
    fleet: 'B737',
    hire_date: '2020-01-01',
  },
]

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */
describe('POST /api/seniority-lists', () => {
  let handler: (event: unknown) => Promise<unknown>
  const fakeEvent = {} as unknown

  beforeAll(async () => {
    const mod = await import('./seniority-lists.post')
    handler = mod.default
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- Standard user path ---

  it('rejects unauthenticated requests', async () => {
    mocks.serverSupabaseUser.mockResolvedValueOnce(null)

    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns 400 when user has no icao_code set', async () => {
    const userClient = makeClient(
      { data: { icao_code: null }, error: null },
      { data: null, error: null },
      { error: null },
    )
    mocks.serverSupabaseUser.mockResolvedValueOnce({ sub: 'user-123' })
    mocks.validateBody.mockResolvedValueOnce({ entries: fakeEntries, effective_date: '2024-01-01' })
    mocks.serverSupabaseClient.mockReturnValue(userClient)

    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('inserts list and entries for authenticated user', async () => {
    const fakeListId = 'list-uuid-001'
    const userClient = makeClient(
      { data: { icao_code: 'UAL' }, error: null },
      { data: { id: fakeListId }, error: null },
      { error: null },
    )
    mocks.serverSupabaseUser.mockResolvedValueOnce({ sub: 'user-123' })
    mocks.validateBody.mockResolvedValueOnce({ entries: fakeEntries, effective_date: '2024-01-01' })
    mocks.serverSupabaseClient.mockReturnValue(userClient)

    const result = await handler(fakeEvent) as { id: string; count: number }

    expect(result.id).toBe(fakeListId)
    expect(result.count).toBe(1)
    expect(userClient.from).toHaveBeenCalledWith('seniority_lists')
    expect(userClient._listChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ airline: 'UAL', uploaded_by: 'user-123' }),
    )
  })

  it('returns 500 when list insert fails', async () => {
    const userClient = makeClient(
      { data: { icao_code: 'UAL' }, error: null },
      { data: null, error: { message: 'Insert failed' } },
      { error: null },
    )
    mocks.serverSupabaseUser.mockResolvedValueOnce({ sub: 'user-123' })
    mocks.validateBody.mockResolvedValueOnce({ entries: fakeEntries, effective_date: '2024-01-01' })
    mocks.serverSupabaseClient.mockReturnValue(userClient)

    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 500 })
  })

  // --- Admin on-behalf-of path ---

  it('allows admin to upload on behalf of another user', async () => {
    const fakeListId = 'list-uuid-002'
    const targetUserId = 'target-user-uuid'
    const serviceClient = makeClient(
      { data: { icao_code: 'DAL' }, error: null },
      { data: { id: fakeListId }, error: null },
      { error: null },
    )

    mocks.serverSupabaseUser.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.validateBody.mockResolvedValueOnce({
      entries: fakeEntries,
      effective_date: '2024-01-01',
      targetUserId,
    })
    mocks.serverSupabaseServiceRole.mockReturnValue(serviceClient)

    const result = await handler(fakeEvent) as { id: string; count: number }

    expect(result.id).toBe(fakeListId)
    expect(mocks.requireAdmin).toHaveBeenCalledWith(fakeEvent)
    expect(mocks.serverSupabaseServiceRole).toHaveBeenCalledWith(fakeEvent)
    expect(serviceClient._listChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ airline: 'DAL', uploaded_by: targetUserId }),
    )
  })

  it('rejects non-admin attempting on-behalf-of upload', async () => {
    mocks.serverSupabaseUser.mockResolvedValueOnce({ sub: 'regular-user' })
    mocks.requireAdmin.mockRejectedValueOnce(
      Object.assign(new Error('Forbidden'), { statusCode: 403 }),
    )
    mocks.validateBody.mockResolvedValueOnce({
      entries: fakeEntries,
      effective_date: '2024-01-01',
      targetUserId: 'some-other-user',
    })

    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns 400 when target user has no icao_code', async () => {
    const targetUserId = 'target-user-uuid'
    const serviceClient = makeClient(
      { data: { icao_code: null }, error: null },
      { data: null, error: null },
      { error: null },
    )

    mocks.serverSupabaseUser.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.validateBody.mockResolvedValueOnce({
      entries: fakeEntries,
      effective_date: '2024-01-01',
      targetUserId,
    })
    mocks.serverSupabaseServiceRole.mockReturnValue(serviceClient)

    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 400 })
  })
})
