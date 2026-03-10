// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { UpdateProfileSchema, UpdatePreferencesSchema, ChangePasswordSchema, ChangeEmailSchema, UpdateEmployeeNumberSchema } from './settings'

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
      expect(result.error.issues[0]!.path).toContain('confirmPassword')
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

describe('ChangeEmailSchema', () => {
  it('accepts a valid email', () => {
    const result = ChangeEmailSchema.safeParse({ newEmail: 'new@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = ChangeEmailSchema.safeParse({ newEmail: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty string', () => {
    const result = ChangeEmailSchema.safeParse({ newEmail: '' })
    expect(result.success).toBe(false)
  })
})

describe('UpdateEmployeeNumberSchema', () => {
  it('accepts a valid employee number', () => {
    expect(UpdateEmployeeNumberSchema.safeParse({ employeeNumber: '12345' }).success).toBe(true)
  })

  it('accepts a single character employee number', () => {
    expect(UpdateEmployeeNumberSchema.safeParse({ employeeNumber: 'A' }).success).toBe(true)
  })

  it('accepts a 20 character employee number', () => {
    expect(UpdateEmployeeNumberSchema.safeParse({ employeeNumber: '12345678901234567890' }).success).toBe(true)
  })

  it('rejects an empty string', () => {
    const result = UpdateEmployeeNumberSchema.safeParse({ employeeNumber: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]!.message).toBe('Employee number is required')
    }
  })

  it('rejects a string longer than 20 characters', () => {
    expect(UpdateEmployeeNumberSchema.safeParse({ employeeNumber: '123456789012345678901' }).success).toBe(false)
  })

  it('rejects missing employeeNumber field', () => {
    expect(UpdateEmployeeNumberSchema.safeParse({}).success).toBe(false)
  })
})
