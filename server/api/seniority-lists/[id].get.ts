import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { SeniorityListIdSchema, SeniorityListResponseSchema } from '#shared/schemas/seniority-list'
import { createLogger } from '#shared/utils/logger'
import { parseResponse } from '../../utils/validation'
import type { Database } from '#shared/types/database'

const log = createLogger('seniority-api')

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { id } = await validateRouteParam(event, 'id', SeniorityListIdSchema)

  const client = await serverSupabaseClient<Database>(event)

  const { data, error } = await client
    .from('seniority_lists')
    .select('id, airline, title, effective_date, created_at')
    .eq('id', id)
    .single()

  if (error || !data) {
    log.warn('List not found', { userId: user.sub, listId: id, error: error?.message })
    throw createError({ statusCode: 404, statusMessage: 'List not found' })
  }

  return parseResponse(SeniorityListResponseSchema, data, 'seniority-lists/[id].get')
})
