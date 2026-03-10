import { z } from 'zod'
import { ISO_DATE_REGEX } from '#shared/constants'
// Re-export date utilities so existing consumers don't break during incremental migration
export { normalizeDate, computeRetireDate } from '#shared/utils/date'
export { ISO_DATE_REGEX as isoDateRegex } from '#shared/constants'

/** Strip leading zeroes from purely numeric strings. "007123" -> "7123", "0" -> "0" */
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
  hire_date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format'),
  retire_date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format').optional(),
})
export type SeniorityEntry = z.infer<typeof SeniorityEntrySchema>

export const SeniorityListIdSchema = z.object({
  id: z.string().uuid('Invalid list ID'),
})
export type SeniorityListId = z.infer<typeof SeniorityListIdSchema>

export const CreateSeniorityListSchema = z.object({
  effective_date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format'),
  entries: z.array(SeniorityEntrySchema).min(1, 'At least one entry is required'),
})
export type CreateSeniorityList = z.infer<typeof CreateSeniorityListSchema>

export const UpdateSeniorityListSchema = z.object({
  airline: z.string().min(1, 'Airline is required').optional(),
  effective_date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format').optional(),
}).refine(d => d.airline !== undefined || d.effective_date !== undefined, {
  message: 'At least one field must be provided',
})
export type UpdateSeniorityList = z.infer<typeof UpdateSeniorityListSchema>
