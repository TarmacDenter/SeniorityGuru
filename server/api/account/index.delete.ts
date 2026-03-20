import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('api:account/delete')

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const client = serverSupabaseServiceRole(event)

  // Log the event BEFORE deletion so actor_id FK is still valid at insert time.
  // After the user is deleted, Postgres will SET NULL on this row automatically.
  const { error: logError } = await client
    .from('admin_activity_log')
    .insert({
      event_type: 'account_deletion',
      actor_id: user.sub,
      metadata: { email: user.email },
    })

  if (logError) {
    log.error('Failed to log account deletion event', { userId: user.sub, error: logError.message })
    // Non-fatal: continue with deletion even if logging fails
  }

  // seniority_lists.uploaded_by FK has no CASCADE — must delete lists before
  // auth.admin.deleteUser (which cascades to profiles).
  const { error: listsError } = await client
    .from('seniority_lists')
    .delete()
    .eq('uploaded_by', user.sub)

  if (listsError) {
    log.error('Failed to delete user seniority lists', { userId: user.sub, error: listsError.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete account' })
  }

  const { error } = await client.auth.admin.deleteUser(user.sub)

  if (error) {
    log.error('Failed to delete auth user', { userId: user.sub, error: error.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete account' })
  }

  return { success: true }
})
