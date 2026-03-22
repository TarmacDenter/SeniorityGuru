import { z } from 'zod'
import { ISO_DATE_REGEX } from '#shared/constants'

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
  hire_date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format'),
  retire_date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format'),
})
export type SeniorityEntry = z.infer<typeof SeniorityEntrySchema>

export const SeniorityListIdSchema = z.object({
  id: z.string().uuid('Invalid list ID'),
})
export type SeniorityListId = z.infer<typeof SeniorityListIdSchema>

export const CreateSeniorityListSchema = z.object({
  effective_date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format'),
  entries: z.array(SeniorityEntrySchema).min(1, 'At least one entry is required'),
  title: z.string().min(1).optional(),
  targetUserId: z.string().uuid().optional(),
})
export type CreateSeniorityList = z.infer<typeof CreateSeniorityListSchema>

export const UpdateSeniorityListSchema = z.object({
  title: z.string().min(1).optional(),
  effective_date: z.string().regex(ISO_DATE_REGEX, 'Invalid date format').optional(),
}).refine(d => d.title !== undefined || d.effective_date !== undefined, {
  message: 'At least one field must be provided',
})
export type UpdateSeniorityList = z.infer<typeof UpdateSeniorityListSchema>

export const SeniorityListResponseSchema = z.object({
  id: z.string().uuid(),
  airline: z.string(),
  title: z.string().nullable(),
  effective_date: z.string(),
  created_at: z.string(),
})
export type SeniorityListResponse = z.infer<typeof SeniorityListResponseSchema>

export const SeniorityEntryResponseSchema = z.object({
  ...SeniorityEntrySchema.shape,
  id: z.string().uuid(),
  list_id: z.string().uuid(),
})
export type SeniorityEntryResponse = z.infer<typeof SeniorityEntryResponseSchema>

export const CreateSeniorityListResponseSchema = z.object({
  id: z.string().uuid(),
  count: z.number(),
})
export type CreateSeniorityListResponse = z.infer<typeof CreateSeniorityListResponseSchema>
