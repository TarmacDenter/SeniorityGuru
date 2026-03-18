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
  validateRouteParam: mocks.validateRouteParam,
  parseResponse: mocks.parseResponse,
})

/* Explicit module mocks */
vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mocks.serverSupabaseServiceRole,
}))

vi.mock('~~/shared/schemas/admin', () => ({
  AdminUserDetailSchema: 'AdminUserDetailSchema',
}))

vi.mock('#server/api/admin/logger', () => ({
  createAdminLogger: () => mockLogger,
}))

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */
describe('GET /api/admin/users/[id]', () => {
  let handler: (event: unknown) => Promise<unknown>
  const fakeEvent = {} as unknown
  const fakeUserId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

  // Chainable mock client
  const mockClient: Record<string, ReturnType<typeof vi.fn>> = {}
  mockClient.from = vi.fn(() => mockClient)
  mockClient.select = vi.fn(() => mockClient)
  mockClient.eq = vi.fn(() => mockClient)
  mockClient.single = vi.fn()
  mockClient.auth = {
    admin: {
      getUserById: vi.fn(),
    },
  }

  beforeAll(async () => {
    const mod = await import('./[id].get')
    handler = mod.default
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.serverSupabaseServiceRole.mockReturnValue(mockClient)
    mockClient.from.mockReturnValue(mockClient)
    mockClient.select.mockReturnValue(mockClient)
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

  it('rejects invalid id', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.validateRouteParam.mockRejectedValueOnce(
      Object.assign(new Error('Invalid id'), { statusCode: 422 }),
    )

    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 422 })
  })

  it('returns merged user detail from auth and profile', async () => {
    const fakeAuthUser = {
      id: fakeUserId,
      email: 'alice@example.com',
      created_at: '2024-01-01T00:00:00Z',
      last_sign_in_at: '2024-06-01T12:00:00Z',
    }
    const fakeProfile = {
      role: 'user',
      icao_code: 'UAL',
      employee_number: 'E001',
    }

    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.validateRouteParam.mockResolvedValueOnce({ id: fakeUserId })
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: fakeAuthUser }, error: null })
    mockClient.single.mockResolvedValueOnce({ data: fakeProfile, error: null })

    const result = await handler(fakeEvent) as any

    expect(mockClient.auth.admin.getUserById).toHaveBeenCalledWith(fakeUserId)
    expect(mockClient.from).toHaveBeenCalledWith('profiles')
    expect(mockClient.eq).toHaveBeenCalledWith('id', fakeUserId)
    expect(mocks.parseResponse).toHaveBeenCalledWith(
      'AdminUserDetailSchema',
      expect.objectContaining({
        id: fakeUserId,
        email: 'alice@example.com',
        role: 'user',
        icao_code: 'UAL',
        employee_number: 'E001',
      }),
      'admin/users/[id].get',
    )
    expect(result).toMatchObject({
      id: fakeUserId,
      email: 'alice@example.com',
      role: 'user',
    })
  })

  it('returns 404 when auth user not found', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.validateRouteParam.mockResolvedValueOnce({ id: fakeUserId })
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: null }, error: { message: 'User not found' } })

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'User not found',
    })
  })

  it('returns 500 when profile query fails', async () => {
    const fakeAuthUser = {
      id: fakeUserId,
      email: 'alice@example.com',
      created_at: '2024-01-01T00:00:00Z',
      last_sign_in_at: null,
    }

    mocks.requireAdmin.mockResolvedValueOnce({ sub: 'admin-id' })
    mocks.validateRouteParam.mockResolvedValueOnce({ id: fakeUserId })
    mockClient.auth.admin.getUserById.mockResolvedValueOnce({ data: { user: fakeAuthUser }, error: null })
    mockClient.single.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Failed to fetch user profile',
    })
  })
})
