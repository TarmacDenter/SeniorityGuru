import { serverSupabaseServiceRole } from '#supabase/server'
import { UpdateUserProfileSchema, AdminUserIdSchema } from '#shared/schemas/admin'
import { createAdminLogger } from '#server/api/admin/logger'

const log = createAdminLogger('users/profile/patch')

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const { id } = await validateRouteParam(event, 'id', AdminUserIdSchema)
  const body = await validateBody(event, UpdateUserProfileSchema)

  const updates: Record<string, unknown> = {}
  if (body.icaoCode !== undefined) updates.icao_code = body.icaoCode
  if (body.employeeNumber !== undefined) updates.employee_number = body.employeeNumber
  if (body.mandatoryRetirementAge !== undefined) updates.mandatory_retirement_age = body.mandatoryRetirementAge

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select('id, icao_code, employee_number, mandatory_retirement_age')
    .single()

  if (error || !data) {
    if (error?.code === 'PGRST116') {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }
    log.error('Failed to update profile', { targetId: id, error: error?.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to update profile' })
  }

  log.info('User profile updated', {
    adminId: admin.sub,
    targetId: id,
    fields: Object.keys(updates),
  })
  return data
})
