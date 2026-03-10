import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('profile-api')

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.sub)
    .single()

  if (error) {
    log.error('Profile fetch failed', { userId: user.sub, error: error.message })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'Profile not found' })
  }

  log.debug('Profile fetched', { userId: user.sub })

  return data
})
