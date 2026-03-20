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
      serverSupabaseUser: vi.fn(),
      serverSupabaseServiceRole: vi.fn(),
    },
  }
})

/* Nitro auto-imports → globals */
Object.assign(globalThis, {
  defineEventHandler: (fn: (...args: unknown[]) => unknown) => fn,
  createError: (opts: { statusCode: number; statusMessage: string }) =>
    Object.assign(new Error(opts.statusMessage), opts),
})

/* Explicit module mocks */
vi.mock('#supabase/server', () => ({
  serverSupabaseUser: mocks.serverSupabaseUser,
  serverSupabaseServiceRole: mocks.serverSupabaseServiceRole,
}))

vi.mock('#shared/utils/logger', () => ({
  createLogger: () => mockLogger,
}))

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */
describe('DELETE /api/account', () => {
  let handler: (event: unknown) => Promise<unknown>
  const fakeEvent = {} as unknown
  const fakeUser = { sub: 'user-uuid-123', email: 'pilot@example.com' }

  // Chainable mock client
  const mockClient = {
    from: vi.fn(),
    auth: {
      admin: {
        deleteUser: vi.fn(),
      },
    },
  }
  const mockChain = {
    delete: vi.fn(),
    eq: vi.fn(),
    insert: vi.fn(),
  }

  beforeAll(async () => {
    const mod = await import('./index.delete')
    handler = mod.default
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.serverSupabaseServiceRole.mockReturnValue(mockClient)
    mockClient.from.mockReturnValue(mockChain)
    mockChain.delete.mockReturnValue(mockChain)
    mockChain.eq.mockResolvedValue({ error: null })
    mockChain.insert.mockResolvedValue({ error: null })
    mockClient.auth.admin.deleteUser.mockResolvedValue({ error: null })
  })

  it('returns 401 when unauthenticated', async () => {
    mocks.serverSupabaseUser.mockResolvedValueOnce(null)

    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('logs account_deletion event before deleting the user', async () => {
    mocks.serverSupabaseUser.mockResolvedValueOnce(fakeUser)
    const insertOrder: string[] = []
    const deleteUserOrder: string[] = []

    mockChain.insert.mockImplementation(() => {
      insertOrder.push('insert')
      return Promise.resolve({ error: null })
    })
    mockClient.auth.admin.deleteUser.mockImplementation(() => {
      deleteUserOrder.push('deleteUser')
      return Promise.resolve({ error: null })
    })

    await handler(fakeEvent)

    expect(mockClient.from).toHaveBeenCalledWith('admin_activity_log')
    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'account_deletion',
        actor_id: fakeUser.sub,
        metadata: expect.objectContaining({ email: fakeUser.email }),
      }),
    )
    // insert must have been called before deleteUser
    expect(insertOrder[0]).toBe('insert')
    expect(deleteUserOrder[0]).toBe('deleteUser')
  })

  it('deletes seniority_lists for the user before calling auth.admin.deleteUser', async () => {
    mocks.serverSupabaseUser.mockResolvedValueOnce(fakeUser)
    const callOrder: string[] = []

    mockChain.insert.mockImplementation(() => {
      callOrder.push('insert')
      return Promise.resolve({ error: null })
    })
    mockChain.eq.mockImplementation(() => {
      callOrder.push('lists-delete')
      return Promise.resolve({ error: null })
    })
    mockClient.auth.admin.deleteUser.mockImplementation(() => {
      callOrder.push('deleteUser')
      return Promise.resolve({ error: null })
    })

    await handler(fakeEvent)

    expect(mockClient.from).toHaveBeenCalledWith('seniority_lists')
    expect(mockChain.delete).toHaveBeenCalled()
    expect(mockChain.eq).toHaveBeenCalledWith('uploaded_by', fakeUser.sub)
    expect(callOrder.indexOf('lists-delete')).toBeLessThan(callOrder.indexOf('deleteUser'))
  })

  it('returns { success: true } on successful deletion', async () => {
    mocks.serverSupabaseUser.mockResolvedValueOnce(fakeUser)

    const result = await handler(fakeEvent)

    expect(result).toEqual({ success: true })
  })

  it('returns 500 generically when list deletion fails', async () => {
    mocks.serverSupabaseUser.mockResolvedValueOnce(fakeUser)
    mockChain.eq.mockResolvedValueOnce({ error: { message: 'DB error' } })

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Failed to delete account',
    })
    expect(mockClient.auth.admin.deleteUser).not.toHaveBeenCalled()
  })

  it('returns 500 generically when auth.admin.deleteUser fails', async () => {
    mocks.serverSupabaseUser.mockResolvedValueOnce(fakeUser)
    mockClient.auth.admin.deleteUser.mockResolvedValueOnce({ error: { message: 'Auth error' } })

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Failed to delete account',
    })
  })
})
