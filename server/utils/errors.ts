import type { ZodIssue } from 'zod'

/** Throw a 422 validation error with Zod issues */
export function throwValidationError(issues: ZodIssue[]): never {
  throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: issues })
}

/** Throw a 404 not-found error */
export function throwNotFound(resource: string): never {
  throw createError({ statusCode: 404, statusMessage: `${resource} not found` })
}

/** Throw a 403 forbidden error */
export function throwForbidden(message = 'Forbidden'): never {
  throw createError({ statusCode: 403, statusMessage: message })
}
