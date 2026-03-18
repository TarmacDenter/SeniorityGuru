// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  UpdateUserRoleSchema,
  InviteUserSchema,
  ResetUserPasswordSchema,
  AdminUserIdSchema,
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
