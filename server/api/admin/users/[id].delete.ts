import { serverSupabaseServiceRole } from '#supabase/server'
import { AdminUserIdSchema } from '#shared/schemas/admin'
import { createAdminLogger } from '#server/api/admin/logger'

const log = createAdminLogger('users/delete')

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const { id } = await validateRouteParam(event, 'id', AdminUserIdSchema)

  if (id === admin.sub) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot delete your own account' })
  }

  const client = serverSupabaseServiceRole(event)

  // uploaded_by FK has no CASCADE — must delete lists before the auth user
  const { error: listsError } = await client
    .from('seniority_lists')
    .delete()
    .eq('uploaded_by', id)

  if (listsError) {
    log.error('Failed to delete user seniority lists', { adminId: admin.sub, targetId: id, error: listsError.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete user' })
  }

  const { error } = await client.auth.admin.deleteUser(id)

  if (error) {
    log.error('Failed to delete user', { adminId: admin.sub, targetId: id, error: error.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete user' })
  }

  log.info('User deleted', { adminId: admin.sub, targetId: id })
  return { success: true }
})
