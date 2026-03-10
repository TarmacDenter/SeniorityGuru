import { serverSupabaseServiceRole } from '#supabase/server'
import { UpdateUserRoleSchema, AdminUserIdSchema } from '#shared/schemas/admin'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('admin-api')

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const { id } = await validateRouteParam(event, 'id', AdminUserIdSchema)
  const { role } = await validateBody(event, UpdateUserRoleSchema)

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select('id, role')
    .single()

  if (error || !data) {
    log.error('Failed to update user role', { targetId: id, error: error?.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to update role' })
  }

  log.info('User role updated', { adminId: admin.sub, targetId: data.id, newRole: data.role })
  return data
})
