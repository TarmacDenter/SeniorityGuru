import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createLogger } from '#shared/utils/logger'
import { ProfileResponseSchema } from '#shared/schemas/settings'
import { parseResponse } from '../utils/validation'
import type { Database } from '#shared/types/database'

const log = createLogger('profile-api')

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient<Database>(event)

  const { data, error } = await client
    .from('profiles')
    .select('id, role, icao_code, employee_number, mandatory_retirement_age, created_at')
    .eq('id', user.sub)
    .maybeSingle()

  if (error) {
    log.error('Profile fetch failed', { userId: user.sub, error: error.message })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }

  if (!data) {
    log.warn('Profile not found', { userId: user.sub })
    throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
  }

  log.debug('Profile fetched', { userId: user.sub })

  return parseResponse(ProfileResponseSchema, data, 'profile.get')
})
