// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { formatRowError } from './formatRowError'

describe('formatRowError', () => {
  it('formats "String must contain at least 1 character(s)" as required', () => {
    expect(formatRowError('seat: String must contain at least 1 character(s)'))
      .toBe('Seat is required')
  })

  it('formats hire_date regex error as date format hint', () => {
    expect(formatRowError('hire_date: Invalid'))
      .toBe('Hire date must be in YYYY-MM-DD format')
  })

  it('formats retire_date regex error', () => {
    expect(formatRowError('retire_date: Invalid'))
      .toBe('Retire date must be in YYYY-MM-DD format')
  })

  it('formats seniority_number positive error', () => {
    expect(formatRowError('seniority_number: Number must be greater than 0'))
      .toBe('Seniority number must be greater than 0')
  })

  it('formats employee_number min length', () => {
    expect(formatRowError('employee_number: String must contain at least 1 character(s)'))
      .toBe('Employee number is required')
  })

  it('humanizes unknown field names with underscores', () => {
    expect(formatRowError('some_field: some error'))
      .toBe('Some field: some error')
  })

  it('passes through messages without colon separator unchanged', () => {
    expect(formatRowError('Something went wrong'))
      .toBe('Something went wrong')
  })
})
