import type { H3Event } from 'h3'
import type { ZodSchema } from 'zod'

/**
 * Validate a route parameter against a Zod schema wrapping it in `{ [paramName]: value }`.
 * Throws 422 on failure with Zod issues in the response data.
 */
export async function validateRouteParam<T>(
  event: H3Event,
  paramName: string,
  schema: ZodSchema<T>,
): Promise<T> {
  const raw = { [paramName]: getRouterParam(event, paramName) }
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: `Invalid ${paramName}`,
      data: result.error.issues,
    })
  }
  return result.data
}

/**
 * Validate the request body against a Zod schema.
 * Throws 422 on failure with Zod issues in the response data.
 */
export async function validateBody<T>(
  event: H3Event,
  schema: ZodSchema<T>,
): Promise<T> {
  const body = await readBody(event)
  const result = schema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation failed',
      data: result.error.issues,
    })
  }
  return result.data
}
