import { z, type ZodObject, type ZodRawShape } from 'zod'

/** Reusable UUID string validator */
export function uuidField(message = 'Invalid UUID') {
  return z.string().uuid(message)
}

/**
 * Add password confirmation refinement to any schema that has `password` and `confirmPassword` fields.
 * Returns a ZodEffects that rejects when the two fields don't match.
 */
export function withPasswordConfirmation<T extends ZodRawShape & { password: z.ZodString; confirmPassword: z.ZodString }>(
  schema: ZodObject<T>,
) {
  return schema.refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
}
