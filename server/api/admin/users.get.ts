import { serverSupabaseServiceRole } from '#supabase/server'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('admin-api')

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const client = serverSupabaseServiceRole(event)

  // Fetch auth users
  const { data: authData, error: authError } = await client.auth.admin.listUsers()
  if (authError) {
    log.error('Failed to list auth users', { error: authError.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to list users' })
  }

  // Fetch all profiles
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
      lastSignIn: user.last_sign_in_at,
      createdAt: user.created_at,
      role: profile?.role ?? 'user',
      icaoCode: profile?.icao_code ?? null,
      employeeNumber: profile?.employee_number ?? null,
    }
  })
})
