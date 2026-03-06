// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { UpdateEmployeeNumberSchema } from './profile'

describe('UpdateEmployeeNumberSchema', () => {
  it('accepts a valid employee number', () => {
    const result = UpdateEmployeeNumberSchema.safeParse({ employeeNumber: '12345' })
    expect(result.success).toBe(true)
  })

  it('accepts a single character employee number', () => {
    const result = UpdateEmployeeNumberSchema.safeParse({ employeeNumber: 'A' })
    expect(result.success).toBe(true)
  })

  it('accepts a 20 character employee number', () => {
    const result = UpdateEmployeeNumberSchema.safeParse({ employeeNumber: '12345678901234567890' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty string', () => {
    const result = UpdateEmployeeNumberSchema.safeParse({ employeeNumber: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Employee number is required')
    }
  })

  it('rejects a string longer than 20 characters', () => {
    const result = UpdateEmployeeNumberSchema.safeParse({ employeeNumber: '123456789012345678901' })
    expect(result.success).toBe(false)
  })

  it('rejects missing employeeNumber field', () => {
    const result = UpdateEmployeeNumberSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
