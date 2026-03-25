// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { genericParser } from './generic'

describe('genericParser', () => {
  it('has correct id and label', () => {
    expect(genericParser.id).toBe('generic')
    expect(genericParser.label).toBe('Generic / Other Airline')
  })

  it('returns rows unchanged (pass-through)', () => {
    const raw = [
      ['Seniority Number', 'Employee Number', 'Seat'],
      ['1', '900001', 'CA'],
      ['2', '900002', 'FO'],
    ]
    const result = genericParser.parse(raw)
    expect(result.rows).toBe(raw)
  })

  it('returns null metadata', () => {
    const result = genericParser.parse([['Header'], ['Data']])
    expect(result.metadata).toEqual({ effectiveDate: null, title: null })
  })
})
