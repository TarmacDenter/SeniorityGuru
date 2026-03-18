import { serverSupabaseServiceRole } from '#supabase/server'
import { AdminUserDetailSchema } from '#shared/schemas/admin'
import { createAdminLogger } from '#server/api/admin/logger'
import { z } from 'zod'

const logger = createAdminLogger('users/get')

const UserIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const { id } = await validateRouteParam(event, 'id', UserIdParamSchema)

  const client = serverSupabaseServiceRole(event)

  const { data: authData, error: authError } = await client.auth.admin.getUserById(id)

  if (authError || !authData?.user) {
    logger.error('Auth user not found', { id, error: authError?.message })
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const authUser = authData.user

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role, icao_code, employee_number')
    .eq('id', id)
    .single()

  if (profileError) {
    logger.error('Failed to fetch user profile', { id, error: profileError.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch user profile' })
  }

  return parseResponse(AdminUserDetailSchema, {
    id: authUser.id,
    email: authUser.email ?? null,
    created_at: authUser.created_at,
    last_sign_in_at: authUser.last_sign_in_at ?? null,
    role: profile?.role ?? 'user',
    icao_code: profile?.icao_code ?? null,
    employee_number: profile?.employee_number ?? null,
  }, 'admin/users/[id].get')
})
