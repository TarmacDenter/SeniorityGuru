// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { uuidField, withPasswordConfirmation } from './common'

describe('uuidField', () => {
  it('accepts valid UUID', () => {
    const schema = z.object({ id: uuidField() })
    expect(schema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' }).success).toBe(true)
  })

  it('rejects non-UUID', () => {
    const schema = z.object({ id: uuidField() })
    expect(schema.safeParse({ id: 'abc' }).success).toBe(false)
  })

  it('uses custom message', () => {
    const schema = z.object({ id: uuidField('Bad ID') })
    const result = schema.safeParse({ id: 'abc' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]!.message).toBe('Bad ID')
    }
  })
})

describe('withPasswordConfirmation', () => {
  const baseSchema = z.object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })

  it('accepts matching passwords', () => {
    const schema = withPasswordConfirmation(baseSchema)
    expect(schema.safeParse({ password: 'secret123', confirmPassword: 'secret123' }).success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const schema = withPasswordConfirmation(baseSchema)
    const result = schema.safeParse({ password: 'secret123', confirmPassword: 'different1' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]!.path).toContain('confirmPassword')
    }
  })

  it('works with extra fields', () => {
    const extendedSchema = z.object({
      currentPassword: z.string().min(8),
      password: z.string().min(8),
      confirmPassword: z.string().min(8),
    })
    const schema = withPasswordConfirmation(extendedSchema)
    expect(schema.safeParse({
      currentPassword: 'oldpass12',
      password: 'newpass12',
      confirmPassword: 'newpass12',
    }).success).toBe(true)
  })
})
