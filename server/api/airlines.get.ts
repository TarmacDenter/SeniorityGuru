import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { createLogger } from '#shared/utils/logger'
import { AirlineResponseSchema } from '#shared/schemas/common'
import { parseResponse } from '../utils/validation'
import type { Database } from '#shared/types/database'

const log = createLogger('airlines-api')

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = await serverSupabaseClient<Database>(event)

  const { data, error } = await client
    .from('airlines')
    .select('icao, name, alias')
    .order('name')

  if (error) {
    log.error('Failed to fetch airlines', { error: error.message })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }

  return parseResponse(AirlineResponseSchema.array(), data ?? [], 'airlines.get')
})
