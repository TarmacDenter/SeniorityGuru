import { z } from 'zod'
import { ISO_DATE_REGEX } from '~/utils/date'
import { parsePlainDate, serializePlainDate, type PlainDate } from '~/utils/temporal'

/** Strip leading zeroes from purely numeric strings: "007123" → "7123", "0" → "0". */
export function normalizeEmployeeNumber(value: string): string {
  if (/^\d+$/.test(value)) {
    const stripped = value.replace(/^0+/, '')
    return stripped || '0'
  }
  return value
}

export const SeniorityEntrySchema = z.object({
  seniority_number: z.number().int().positive(),
  employee_number: z.string().min(1),
  seat: z.string().min(1),
  base: z.string().min(1),
  fleet: z.string().min(1),
  name: z.string().optional(),
  hire_date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format').refine(isCalendarDate, 'Invalid calendar date'),
  retire_date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format').refine(isCalendarDate, 'Invalid calendar date').optional(),
})
export type SeniorityEntryInput = z.infer<typeof SeniorityEntrySchema>

/** Validated application entry. Dates are calendar values, not persistence strings. */
export interface SeniorityEntry extends Omit<SeniorityEntryInput, 'hire_date' | 'retire_date'> {
  hire_date: PlainDate
  retire_date: PlainDate | undefined
}

function isCalendarDate(value: string): boolean {
  try {
    parsePlainDate(value)
    return true
  } catch {
    return false
  }
}

export function toDomainSeniorityEntry(input: SeniorityEntryInput | SeniorityEntry): SeniorityEntry {
  return {
    ...input,
    hire_date: typeof input.hire_date === 'string' ? parsePlainDate(input.hire_date) : input.hire_date,
    retire_date: input.retire_date
      ? typeof input.retire_date === 'string' ? parsePlainDate(input.retire_date) : input.retire_date
      : undefined,
  }
}

export function toSeniorityEntryInput(entry: SeniorityEntry): SeniorityEntryInput {
  return {
    ...entry,
    hire_date: serializePlainDate(entry.hire_date),
    retire_date: entry.retire_date ? serializePlainDate(entry.retire_date) : undefined,
  }
}
