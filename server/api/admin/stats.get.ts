import { serverSupabaseServiceRole } from '#supabase/server'
import { AdminStatsResponseSchema } from '#shared/schemas/admin'
import { createAdminLogger } from '#server/api/admin/logger'

const logger = createAdminLogger('stats')

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const client = serverSupabaseServiceRole(event)

  const [profilesResult, listsResult, entriesResult, authResult] = await Promise.all([
    client.from('profiles').select('id, role, icao_code, created_at'),
    client.from('seniority_lists').select('count').limit(1),
    client.from('seniority_entries').select('count').limit(1),
    client.auth.admin.listUsers(),
  ])

  if (profilesResult.error || authResult.error) {
    logger.error('Failed to fetch stats', {
      profilesError: profilesResult.error?.message,
      authError: authResult.error?.message,
    })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch stats' })
  }

  const profiles = profilesResult.data ?? []
  const authUsers = authResult.data?.users ?? []

  const emailMap = new Map<string, string>(
    authUsers.map((u) => [u.id, u.email ?? ''] as [string, string]),
  )

  const totalUsers = profiles.length
  const usersByRole = profiles.reduce(
    (acc: { user: number; admin: number }, p: { role: string }) => {
      if (p.role === 'admin') acc.admin++
      else acc.user++
      return acc
    },
    { user: 0, admin: 0 },
  )

  const totalLists = (listsResult.data?.[0] as { count?: number } | undefined)?.count ?? 0
  const totalEntries = (entriesResult.data?.[0] as { count?: number } | undefined)?.count ?? 0

  const recentSignups = profiles.map((p: { id: string; role: string; icao_code: string | null; created_at: string }) => ({
    id: p.id,
    email: emailMap.get(p.id) ?? null,
    created_at: p.created_at,
    icao_code: p.icao_code ?? null,
  }))

  return parseResponse(AdminStatsResponseSchema, {
    total_users: totalUsers,
    users_by_role: usersByRole,
    total_lists: totalLists,
    total_entries: totalEntries,
    recent_signups: recentSignups,
  }, 'admin/stats.get')
})
