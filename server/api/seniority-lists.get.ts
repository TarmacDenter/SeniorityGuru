import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { type SeniorityListResponse, SeniorityListResponseSchema } from '#shared/schemas/seniority-list'
import { createLogger } from '#shared/utils/logger'
import { parseResponse } from '../utils/validation'
import type { Database } from '#shared/types/database'

const log = createLogger('seniority-api')

export default defineEventHandler(async (event): Promise<SeniorityListResponse[]> => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = user.sub
  log.debug('Fetching lists for user', { userId })

  const client = await serverSupabaseClient<Database>(event)

  const { data, error } = await client
    .from('seniority_lists')
    .select('*')
    .filter('uploaded_by', 'eq', userId)
    .order('effective_date', { ascending: false })

  if (error) {
    log.error('Failed to fetch lists', { userId, error: error.message })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }

  return parseResponse(SeniorityListResponseSchema.array(), data ?? [], 'seniority-lists.get')
})
