import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createLogger } from '#shared/utils/logger'
import { getCached, setCache } from '../utils/seniority-cache'

const log = createLogger('airlines-api')

const AIRLINES_CACHE_KEY = 'seniority:airlines:all'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const cached = await getCached<{ icao: string; name: string; alias: string | null }[]>(AIRLINES_CACHE_KEY)
  if (cached) {
    log.debug('Airlines cache hit')
    return cached
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('airlines')
    .select('icao, name, alias')
    .order('name')

  if (error) {
    log.error('Failed to fetch airlines', { error: error.message })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }

  const airlines = data ?? []

  await setCache(AIRLINES_CACHE_KEY, airlines)
  log.debug('Airlines fetched and cached', { count: airlines.length })

  return airlines
})
