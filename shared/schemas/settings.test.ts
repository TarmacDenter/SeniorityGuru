// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { UpdateProfileSchema, UpdatePreferencesSchema, ChangePasswordSchema } from './settings'

describe('UpdateProfileSchema', () => {
  it('accepts valid profile data', () => {
    const result = UpdateProfileSchema.safeParse({ icaoCode: 'UAL', employeeNumber: '12345' })
    expect(result.success).toBe(true)
  })

  it('accepts empty employee number', () => {
    const result = UpdateProfileSchema.safeParse({ icaoCode: 'UAL', employeeNumber: '' })
    expect(result.success).toBe(true)
  })

  it('rejects icaoCode shorter than 2 chars', () => {
    const result = UpdateProfileSchema.safeParse({ icaoCode: 'U', employeeNumber: '' })
    expect(result.success).toBe(false)
  })

  it('rejects employee number longer than 20 chars', () => {
    const result = UpdateProfileSchema.safeParse({ icaoCode: 'UAL', employeeNumber: 'A'.repeat(21) })
    expect(result.success).toBe(false)
  })
})

describe('UpdatePreferencesSchema', () => {
  it('accepts age 65', () => {
    const result = UpdatePreferencesSchema.safeParse({ mandatoryRetirementAge: 65 })
    expect(result.success).toBe(true)
  })

  it('accepts age 55 (minimum)', () => {
    const result = UpdatePreferencesSchema.safeParse({ mandatoryRetirementAge: 55 })
    expect(result.success).toBe(true)
  })

  it('accepts age 75 (maximum)', () => {
    const result = UpdatePreferencesSchema.safeParse({ mandatoryRetirementAge: 75 })
    expect(result.success).toBe(true)
  })

  it('rejects age below 55', () => {
    const result = UpdatePreferencesSchema.safeParse({ mandatoryRetirementAge: 54 })
    expect(result.success).toBe(false)
  })

  it('rejects age above 75', () => {
    const result = UpdatePreferencesSchema.safeParse({ mandatoryRetirementAge: 76 })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer', () => {
    const result = UpdatePreferencesSchema.safeParse({ mandatoryRetirementAge: 65.5 })
    expect(result.success).toBe(false)
  })
})

describe('ChangePasswordSchema', () => {
  it('accepts matching passwords with valid current password', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'oldpass123',
      password: 'newpass123',
      confirmPassword: 'newpass123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects when passwords do not match', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'oldpass123',
      password: 'newpass123',
      confirmPassword: 'different1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('confirmPassword')
    }
  })

  it('rejects password shorter than 8 chars', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'oldpass123',
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects current password shorter than 8 chars', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'short',
      password: 'newpass123',
      confirmPassword: 'newpass123',
    })
    expect(result.success).toBe(false)
  })
})
