import { z } from 'zod'

/** Strip leading zeroes from purely numeric strings. "007123" -> "7123", "0" -> "0" */
export function normalizeEmployeeNumber(value: string): string {
  if (/^\d+$/.test(value)) {
    const stripped = value.replace(/^0+/, '')
    return stripped || '0'
  }
  return value
}

/**
 * Normalize a date string from common formats into YYYY-MM-DD.
 * Supported inputs: YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY, M/D/YYYY, M/D/YY,
 * DD MMM YYYY (e.g. "15 Jan 2010"), MMM DD YYYY, and Excel serial numbers.
 * Returns the normalized string, or the original if it can't be parsed.
 */
export function normalizeDate(value: string): string {
  const s = value.trim()
  if (!s) return s

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // Excel serial number (pure digits, 4-6 chars — e.g. "40193")
  if (/^\d{4,6}$/.test(s)) {
    const serial = parseInt(s, 10)
    // Excel epoch: Dec 30, 1899 (serial 1 = Jan 1, 1900, with Lotus 123 bug)
    const ms = Date.UTC(1899, 11, 30) + serial * 86400000
    const date = new Date(ms)
    if (!isNaN(date.getTime())) return formatDate(date, true)
  }

  // MM/DD/YYYY or MM-DD-YYYY (with 1 or 2 digit month/day)
  const slashDash = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$/)
  if (slashDash) {
    let [, m, d, y] = slashDash
    if (y!.length === 2) y = (parseInt(y!, 10) > 50 ? '19' : '20') + y
    return `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`
  }

  // "DD MMM YYYY" or "MMM DD, YYYY" or "MMM DD YYYY"
  const parsed = new Date(s)
  if (!isNaN(parsed.getTime()) && s.match(/[a-zA-Z]/)) {
    return formatDate(parsed)
  }

  return s
}

function formatDate(d: Date, utc = false): string {
  const y = utc ? d.getUTCFullYear() : d.getFullYear()
  const m = String((utc ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, '0')
  const day = String(utc ? d.getUTCDate() : d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Compute retirement date from DOB + policy age. Returns ISO date string. */
export function computeRetireDate(dob: string, retirementAge: number): string {
  const date = new Date(dob + 'T00:00:00')
  const dobMonth = date.getMonth()
  date.setFullYear(date.getFullYear() + retirementAge)
  // Handle leap day: if DOB is Feb 29 and target year has no Feb 29, Date rolls to Mar 1.
  // Check and correct back to Feb 28.
  if (dobMonth === 1 && date.getMonth() !== 1) {
    date.setDate(0) // last day of previous month (Feb 28)
  }
  return date.toISOString().slice(0, 10)
}

export const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

export const SeniorityEntrySchema = z.object({
  seniority_number: z.number().int().positive(),
  employee_number: z.string().min(1),
  seat: z.string().min(1),
  base: z.string().min(1),
  fleet: z.string().min(1),
  name: z.string().optional(),
  hire_date: z.string().regex(isoDateRegex, 'Invalid date format'),
  retire_date: z.string().regex(isoDateRegex, 'Invalid date format').optional(),
})
export type SeniorityEntry = z.infer<typeof SeniorityEntrySchema>

export const SeniorityListIdSchema = z.object({
  id: z.string().uuid('Invalid list ID'),
})
export type SeniorityListId = z.infer<typeof SeniorityListIdSchema>

export const CreateSeniorityListSchema = z.object({
  effective_date: z.string().regex(isoDateRegex, 'Invalid date format'),
  entries: z.array(SeniorityEntrySchema).min(1, 'At least one entry is required'),
})
export type CreateSeniorityList = z.infer<typeof CreateSeniorityListSchema>

export const UpdateSeniorityListSchema = z.object({
  airline: z.string().min(1, 'Airline is required').optional(),
  effective_date: z.string().regex(isoDateRegex, 'Invalid date format').optional(),
}).refine(d => d.airline !== undefined || d.effective_date !== undefined, {
  message: 'At least one field must be provided',
})
export type UpdateSeniorityList = z.infer<typeof UpdateSeniorityListSchema>
