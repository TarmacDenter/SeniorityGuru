// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  UpdateUserRoleSchema,
  InviteUserSchema,
  ResetUserPasswordSchema,
  AdminUserIdSchema,
  UpdateUserProfileSchema,
} from './admin'

describe('UpdateUserRoleSchema', () => {
  it('accepts valid roles', () => {
    expect(UpdateUserRoleSchema.safeParse({ role: 'user' }).success).toBe(true)
    expect(UpdateUserRoleSchema.safeParse({ role: 'admin' }).success).toBe(true)
  })

  it('rejects moderator role (removed from UI)', () => {
    expect(UpdateUserRoleSchema.safeParse({ role: 'moderator' }).success).toBe(false)
  })

  it('rejects invalid role', () => {
    expect(UpdateUserRoleSchema.safeParse({ role: 'superadmin' }).success).toBe(false)
  })

  it('rejects missing role', () => {
    expect(UpdateUserRoleSchema.safeParse({}).success).toBe(false)
  })
})

describe('InviteUserSchema', () => {
  it('accepts valid email', () => {
    expect(InviteUserSchema.safeParse({ email: 'pilot@airline.com' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(InviteUserSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })
})

describe('ResetUserPasswordSchema', () => {
  it('accepts valid UUID', () => {
    expect(ResetUserPasswordSchema.safeParse({ userId: '550e8400-e29b-41d4-a716-446655440000' }).success).toBe(true)
  })

  it('rejects non-UUID', () => {
    expect(ResetUserPasswordSchema.safeParse({ userId: 'abc' }).success).toBe(false)
  })
})

describe('AdminUserIdSchema', () => {
  it('accepts valid UUID', () => {
    expect(AdminUserIdSchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' }).success).toBe(true)
  })

  it('rejects non-UUID', () => {
    expect(AdminUserIdSchema.safeParse({ id: 'abc' }).success).toBe(false)
  })
})

describe('UpdateUserProfileSchema', () => {
  it('accepts a valid full update', () => {
    const result = UpdateUserProfileSchema.safeParse({
      icaoCode: 'DAL',
      employeeNumber: '12345',
      mandatoryRetirementAge: 65,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a partial update with only icaoCode', () => {
    const result = UpdateUserProfileSchema.safeParse({ icaoCode: 'UAL' })
    expect(result.success).toBe(true)
  })

  it('accepts null icaoCode to clear the airline', () => {
    const result = UpdateUserProfileSchema.safeParse({ icaoCode: null })
    expect(result.success).toBe(true)
  })

  it('accepts null employeeNumber to clear it', () => {
    const result = UpdateUserProfileSchema.safeParse({ employeeNumber: null })
    expect(result.success).toBe(true)
  })

  it('rejects an empty body', () => {
    const result = UpdateUserProfileSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects icaoCode that is too short', () => {
    const result = UpdateUserProfileSchema.safeParse({ icaoCode: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejects icaoCode that is too long', () => {
    const result = UpdateUserProfileSchema.safeParse({ icaoCode: 'ABCDE' })
    expect(result.success).toBe(false)
  })

  it('rejects mandatoryRetirementAge below 55', () => {
    const result = UpdateUserProfileSchema.safeParse({ mandatoryRetirementAge: 40 })
    expect(result.success).toBe(false)
  })

  it('rejects mandatoryRetirementAge above 75', () => {
    const result = UpdateUserProfileSchema.safeParse({ mandatoryRetirementAge: 80 })
    expect(result.success).toBe(false)
  })
})
