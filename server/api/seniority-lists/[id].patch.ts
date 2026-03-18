import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { SeniorityListIdSchema, UpdateSeniorityListSchema, SeniorityListResponseSchema } from '#shared/schemas/seniority-list'
import { createLogger } from '#shared/utils/logger'
import { parseResponse } from '../../utils/validation'
import type { Database } from '#shared/types/database'

const log = createLogger('seniority-api')

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    log.warn('Unauthenticated update request rejected')
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { id } = await validateRouteParam(event, 'id', SeniorityListIdSchema)
  const body = await validateBody(event, UpdateSeniorityListSchema)

  const client = await serverSupabaseClient<Database>(event)

  const { data, error } = await client
    .from('seniority_lists')
    .update(body)
    .eq('id', id)
    .select('id, airline, title, effective_date, created_at')
    .single()

  if (error || !data) {
    log.warn('Update failed or list not found', { userId: user.sub, listId: id, error: error?.message })
    throw createError({ statusCode: 404, statusMessage: 'List not found' })
  }

  log.info('Seniority list updated', { userId: user.sub, listId: data.id })

  return parseResponse(SeniorityListResponseSchema, data, 'seniority-lists/[id].patch')
})
