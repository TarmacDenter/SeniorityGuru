import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { SeniorityListIdSchema } from '#shared/schemas/seniority-list'
import type { SeniorityListResponse } from '#shared/schemas/seniority-list'
import { createLogger } from '#shared/utils/logger'
import { getCached, setCache, listKey } from '../../utils/seniority-cache'

const log = createLogger('seniority-api')

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { id } = await validateRouteParam(event, 'id', SeniorityListIdSchema)

  const cached = await getCached<SeniorityListResponse>(listKey(id))
  if (cached) {
    log.debug('List cache hit', { listId: id })
    return cached
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('seniority_lists')
    .select('id, airline, title, effective_date, status, created_at')
    .eq('id', id)
    .single()

  if (error || !data) {
    log.warn('List not found', { userId: user.sub, listId: id, error: error?.message })
    throw createError({ statusCode: 404, statusMessage: 'List not found' })
  }

  const list = data as SeniorityListResponse

  await setCache(listKey(id), list)
  log.debug('List fetched and cached', { listId: id })

  return list
})
