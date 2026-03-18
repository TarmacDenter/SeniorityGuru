// @vitest-environment node
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

const { mocks, mockLogger } = vi.hoisted(() => {
  const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  return {
    mockLogger: logger,
    mocks: {
      requireAdmin: vi.fn(),
      validateRouteParam: vi.fn(),
      validateBody: vi.fn(),
      serverSupabaseServiceRole: vi.fn(),
    },
  }
})

Object.assign(globalThis, {
  defineEventHandler: (fn: (event: unknown) => unknown) => fn,
  createError: (opts: { statusCode: number; statusMessage: string }) =>
    Object.assign(new Error(opts.statusMessage), opts),
  requireAdmin: mocks.requireAdmin,
  validateRouteParam: mocks.validateRouteParam,
  validateBody: mocks.validateBody,
})

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mocks.serverSupabaseServiceRole,
}))

vi.mock('~~/shared/schemas/admin', () => ({
  UpdateUserProfileSchema: 'UpdateUserProfileSchema',
  AdminUserIdSchema: 'AdminUserIdSchema',
}))

vi.mock('#server/api/admin/logger', () => ({
  createAdminLogger: () => mockLogger,
}))

describe('PATCH /api/admin/users/[id]/profile', () => {
  let handler: (event: unknown) => Promise<unknown>
  const fakeEvent = {} as unknown
  const fakeAdminId = 'admin-uuid-1234'
  const fakeUserId = 'user-uuid-5678'

  const mockClient: Record<string, ReturnType<typeof vi.fn>> = {}
  mockClient.from = vi.fn(() => mockClient)
  mockClient.update = vi.fn(() => mockClient)
  mockClient.eq = vi.fn(() => mockClient)
  mockClient.select = vi.fn(() => mockClient)
  mockClient.single = vi.fn()

  beforeAll(async () => {
    const mod = await import('./profile.patch')
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

  it('rejects non-admin callers with 403', async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      Object.assign(new Error('Forbidden'), { statusCode: 403 }),
    )
    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('rejects invalid user id with 422', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: fakeAdminId })
    mocks.validateRouteParam.mockRejectedValueOnce(
      Object.assign(new Error('Invalid id'), { statusCode: 422 }),
    )
    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 422 })
  })

  it('rejects empty body with 422', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: fakeAdminId })
    mocks.validateRouteParam.mockResolvedValueOnce({ id: fakeUserId })
    mocks.validateBody.mockRejectedValueOnce(
      Object.assign(new Error('At least one field is required'), { statusCode: 422 }),
    )
    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 422 })
  })

  it('updates only the fields present in the body', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: fakeAdminId })
    mocks.validateRouteParam.mockResolvedValueOnce({ id: fakeUserId })
    mocks.validateBody.mockResolvedValueOnce({ icaoCode: 'DAL' }) // partial — only icaoCode

    const updatedProfile = {
      id: fakeUserId,
      icao_code: 'DAL',
      employee_number: '12345',
      mandatory_retirement_age: 65,
    }
    mockClient.single.mockResolvedValueOnce({ data: updatedProfile, error: null })

    const result = await handler(fakeEvent)

    // Must only pass icao_code to .update(), not employee_number or mandatory_retirement_age
    expect(mockClient.update).toHaveBeenCalledWith({ icao_code: 'DAL' })
    expect(mockClient.eq).toHaveBeenCalledWith('id', fakeUserId)
    expect(result).toEqual(updatedProfile)
  })

  it('updates all fields when all are provided', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: fakeAdminId })
    mocks.validateRouteParam.mockResolvedValueOnce({ id: fakeUserId })
    mocks.validateBody.mockResolvedValueOnce({
      icaoCode: 'UAL',
      employeeNumber: '99999',
      mandatoryRetirementAge: 60,
    })

    const updatedProfile = {
      id: fakeUserId,
      icao_code: 'UAL',
      employee_number: '99999',
      mandatory_retirement_age: 60,
    }
    mockClient.single.mockResolvedValueOnce({ data: updatedProfile, error: null })

    await handler(fakeEvent)

    expect(mockClient.update).toHaveBeenCalledWith({
      icao_code: 'UAL',
      employee_number: '99999',
      mandatory_retirement_age: 60,
    })
  })

  it('allows setting icaoCode to null to clear the airline', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: fakeAdminId })
    mocks.validateRouteParam.mockResolvedValueOnce({ id: fakeUserId })
    mocks.validateBody.mockResolvedValueOnce({ icaoCode: null })

    const updatedProfile = {
      id: fakeUserId,
      icao_code: null,
      employee_number: null,
      mandatory_retirement_age: 65,
    }
    mockClient.single.mockResolvedValueOnce({ data: updatedProfile, error: null })

    const result = await handler(fakeEvent)
    expect(mockClient.update).toHaveBeenCalledWith({ icao_code: null })
    expect(result).toEqual(updatedProfile)
  })

  it('returns 404 when user profile not found', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: fakeAdminId })
    mocks.validateRouteParam.mockResolvedValueOnce({ id: fakeUserId })
    mocks.validateBody.mockResolvedValueOnce({ icaoCode: 'DAL' })
    mockClient.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'No rows', code: 'PGRST116' },
    })

    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns 500 on unexpected DB error', async () => {
    mocks.requireAdmin.mockResolvedValueOnce({ sub: fakeAdminId })
    mocks.validateRouteParam.mockResolvedValueOnce({ id: fakeUserId })
    mocks.validateBody.mockResolvedValueOnce({ icaoCode: 'DAL' })
    mockClient.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'DB error', code: 'UNEXPECTED' },
    })

    await expect(handler(fakeEvent)).rejects.toMatchObject({ statusCode: 500 })
  })
})
