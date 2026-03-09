import { serverSupabaseServiceRole } from '#supabase/server'
import { UpdateUserRoleSchema, AdminUserIdSchema } from '#shared/schemas/admin'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('admin-api')

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const paramParsed = AdminUserIdSchema.safeParse({ id: getRouterParam(event, 'id') })
  if (!paramParsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid user ID', data: paramParsed.error.issues })
  }

  const body = await readBody(event)
  const bodyParsed = UpdateUserRoleSchema.safeParse(body)
  if (!bodyParsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: bodyParsed.error.issues })
  }

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('profiles')
    .update({ role: bodyParsed.data.role })
    .eq('id', paramParsed.data.id)
    .select('id, role')
    .single()

  if (error || !data) {
    log.error('Failed to update user role', { targetId: paramParsed.data.id, error: error?.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to update role' })
  }

  log.info('User role updated', { adminId: admin.sub, targetId: data.id, newRole: data.role })
  return data
})
