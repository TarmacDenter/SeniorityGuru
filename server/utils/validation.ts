import type { H3Event } from 'h3'
import type { ZodSchema } from 'zod'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('validation')

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

/** Validate DB data against a Zod schema. Throws 500 — a mismatch here is a server-side contract violation. */
export function parseResponse<T>(schema: ZodSchema<T>, data: unknown, context?: string): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    log.error('Response schema mismatch', { context, errors: result.error.errors })
    throw createError({ statusCode: 500, statusMessage: 'Data parsing error' })
  }
  return result.data
}

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
