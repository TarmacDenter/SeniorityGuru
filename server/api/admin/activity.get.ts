import { serverSupabaseServiceRole } from '#supabase/server'
import { AdminActivityResponseSchema } from '#shared/schemas/admin'
import { createAdminLogger } from '#server/api/admin/logger'

const logger = createAdminLogger('activity')

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const client = serverSupabaseServiceRole(event)

  const { data: rows, error: dbError } = await client
    .from('admin_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (dbError) {
    logger.error('Failed to fetch activity log', { error: dbError.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch activity log' })
  }

  const { data: authData, error: authError } = await client.auth.admin.listUsers()

  if (authError) {
    logger.error('Failed to fetch users', { error: authError.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch users' })
  }

  const emailMap = new Map<string, string>(
    authData.users.map((u) => [u.id, u.email ?? ''] as [string, string]),
  )

  const activity = (rows ?? []).map((row: { id: string; event_type: string; actor_id: string | null; metadata: Record<string, unknown>; created_at: string }) => ({
    id: row.id,
    event_type: row.event_type,
    actor_email: row.actor_id ? (emailMap.get(row.actor_id) ?? null) : null,
    metadata: row.metadata,
    created_at: row.created_at,
  }))

  return parseResponse(AdminActivityResponseSchema, activity, 'admin/activity.get')
})
