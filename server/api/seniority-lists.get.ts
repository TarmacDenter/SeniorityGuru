import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { SeniorityListResponse } from '#shared/schemas/seniority-list'
import { createLogger } from '#shared/utils/logger'
import { getCached, setCache, listsKey } from '../utils/seniority-cache'

const log = createLogger('seniority-api')

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const cached = await getCached<SeniorityListResponse[]>(listsKey(user.sub))
  if (cached) {
    log.debug('Lists cache hit', { userId: user.sub })
    return cached
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('seniority_lists')
    .select('id, airline, title, effective_date, status, created_at')
    .order('effective_date', { ascending: false })

  if (error) {
    log.error('Failed to fetch lists', { userId: user.sub, error: error.message })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }

  const lists = (data ?? []) as SeniorityListResponse[]

  await setCache(listsKey(user.sub), lists)
  log.debug('Lists fetched and cached', { userId: user.sub, count: lists.length })

  return lists
})
