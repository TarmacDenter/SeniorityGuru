import { serverSupabaseServiceRole } from '#supabase/server'
import { AdminUserIdSchema } from '#shared/schemas/admin'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('admin-api')

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const { id } = await validateRouteParam(event, 'id', AdminUserIdSchema)

  // Prevent self-deletion
  if (id === admin.sub) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot delete your own account' })
  }

  const client = serverSupabaseServiceRole(event)

  // Delete user's seniority lists first (entries cascade via ON DELETE CASCADE).
  // uploaded_by FK on seniority_lists has no CASCADE, so this must happen before auth deletion.
  const { error: listsError } = await client
    .from('seniority_lists')
    .delete()
    .eq('uploaded_by', id)

  if (listsError) {
    log.error('Failed to delete user seniority lists', { adminId: admin.sub, targetId: id, error: listsError.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete user' })
  }

  // Delete from auth.users — cascades to profiles
  const { error } = await client.auth.admin.deleteUser(id)

  if (error) {
    log.error('Failed to delete user', { adminId: admin.sub, targetId: id, error: error.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete user' })
  }

  log.info('User deleted', { adminId: admin.sub, targetId: id })
  return { success: true }
})
