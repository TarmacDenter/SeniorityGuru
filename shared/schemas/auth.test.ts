// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  LoginSchema,
  SignUpSchema,
  SetupProfileSchema,
  ResetPasswordSchema,
  UpdatePasswordSchema,
  ResendEmailSchema,
} from './auth'

describe('LoginSchema', () => {
  it('accepts valid credentials', () => {
    const result = LoginSchema.safeParse({ email: 'pilot@airline.com', password: 'secret123' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = LoginSchema.safeParse({ email: 'not-an-email', password: 'secret123' })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 8 characters', () => {
    const result = LoginSchema.safeParse({ email: 'pilot@airline.com', password: 'short' })
    expect(result.success).toBe(false)
  })
})

describe('SignUpSchema', () => {
  it('accepts valid signup without airline', () => {
    const result = SignUpSchema.safeParse({
      email: 'pilot@airline.com',
      password: 'password123',
      confirmPassword: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid signup with ICAO code', () => {
    const result = SignUpSchema.safeParse({
      email: 'pilot@airline.com',
      password: 'password123',
      confirmPassword: 'password123',
      icaoCode: 'UAL',
    })
    expect(result.success).toBe(true)
  })

  it('rejects when passwords do not match', () => {
    const result = SignUpSchema.safeParse({
      email: 'pilot@airline.com',
      password: 'password123',
      confirmPassword: 'different456',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('confirmPassword')
    }
  })

  it('rejects invalid email', () => {
    const result = SignUpSchema.safeParse({
      email: 'bad-email',
      password: 'password123',
      confirmPassword: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 8 characters', () => {
    const result = SignUpSchema.safeParse({
      email: 'pilot@airline.com',
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
  })
})

describe('SetupProfileSchema', () => {
  it('accepts a valid ICAO code', () => {
    const result = SetupProfileSchema.safeParse({ icaoCode: 'UAL' })
    expect(result.success).toBe(true)
  })

  it('rejects a single-character code (below min length of 2)', () => {
    const result = SetupProfileSchema.safeParse({ icaoCode: 'U' })
    expect(result.success).toBe(false)
  })

  it('rejects empty string', () => {
    const result = SetupProfileSchema.safeParse({ icaoCode: '' })
    expect(result.success).toBe(false)
  })
})

describe('ResetPasswordSchema', () => {
  it('accepts a valid email', () => {
    const result = ResetPasswordSchema.safeParse({ email: 'pilot@airline.com' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = ResetPasswordSchema.safeParse({ email: 'not-valid' })
    expect(result.success).toBe(false)
  })
})

describe('UpdatePasswordSchema', () => {
  it('accepts matching passwords of sufficient length', () => {
    const result = UpdatePasswordSchema.safeParse({
      password: 'newpassword1',
      confirmPassword: 'newpassword1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = UpdatePasswordSchema.safeParse({
      password: 'newpassword1',
      confirmPassword: 'differentpass',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('confirmPassword')
    }
  })

  it('rejects password shorter than 8 characters', () => {
    const result = UpdatePasswordSchema.safeParse({
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
  })
})

describe('ResendEmailSchema', () => {
  it('accepts a valid email', () => {
    const result = ResendEmailSchema.safeParse({ email: 'pilot@airline.com' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = ResendEmailSchema.safeParse({ email: 'not-valid' })
    expect(result.success).toBe(false)
  })
})
