import { z } from 'zod'
import { ISO_DATE_REGEX } from '~/utils/date'

/** Strip leading zeroes from purely numeric strings: "007123" → "7123", "0" → "0". */
export function normalizeEmployeeNumber(value: string): string {
  if (/^\d+$/.test(value)) {
    const stripped = value.replace(/^0+/, '')
    return stripped || '0'
  }
  return value
}

/** Trim whitespace and normalize numeric leading-zero formatting. */
export function canonicalizeEmployeeNumber(value: string): string {
  return normalizeEmployeeNumber(value.trim())
}

export const SeniorityEntrySchema = z.object({
  seniority_number: z.number().int().positive(),
  employee_number: z.string().min(1),
  seat: z.string().min(1),
  base: z.string().min(1),
  fleet: z.string().min(1),
  name: z.string().optional(),
  hire_date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format'),
  retire_date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format'),
})
export type SeniorityEntry = z.infer<typeof SeniorityEntrySchema>
