import type { ZodIssue } from 'zod'

export function throwValidationError(issues: ZodIssue[]): never {
  throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: issues })
}

export function throwNotFound(resource: string): never {
  throw createError({ statusCode: 404, statusMessage: `${resource} not found` })
}

export function throwForbidden(message = 'Forbidden'): never {
  throw createError({ statusCode: 403, statusMessage: message })
}
