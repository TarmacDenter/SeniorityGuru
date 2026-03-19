import { serverSupabaseServiceRole } from '#supabase/server'
import { createAdminLogger } from '#server/api/admin/logger'

const log = createAdminLogger('users')

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const client = serverSupabaseServiceRole<Database>(event)

  const { data: authData, error: authError } = await client.auth.admin.listUsers()
  if (authError) {
    log.error('Failed to list auth users', { error: authError.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to list users' })
  }

  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('id, role, icao_code, employee_number, created_at')

  if (profilesError) {
    log.error('Failed to list profiles', { error: profilesError.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to list profiles' })
  }

  const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? [])

  return authData.users.map(user => {
    const profile = profileMap.get(user.id)
    return {
      id: user.id,
      email: user.email,
      last_sign_in_at: user.last_sign_in_at,
      created_at: user.created_at,
      role: profile?.role ?? 'user',
      icao_code: profile?.icao_code ?? null,
      employee_number: profile?.employee_number ?? null,
    }
  })
})
