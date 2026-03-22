import { z, type ZodObject, type ZodRawShape } from 'zod'

export function uuidField(message = 'Invalid UUID') {
  return z.string().uuid(message)
}

export const AirlineResponseSchema = z.object({
  icao: z.string(),
  name: z.string(),
  alias: z.string().nullable(),
})
export type AirlineResponse = z.infer<typeof AirlineResponseSchema>

export function withPasswordConfirmation<T extends ZodRawShape & { password: z.ZodString; confirmPassword: z.ZodString }>(
  schema: ZodObject<T>,
) {
  return schema.refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
}
