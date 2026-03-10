import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { SeniorityListIdSchema } from '#shared/schemas/seniority-list'
import type { SeniorityEntryResponse } from '#shared/schemas/seniority-list'
import { createLogger } from '#shared/utils/logger'
import { getCached, setCache, entriesKey } from '../../../utils/seniority-cache'
import { fetchAllRows } from '../../../utils/fetchAllRows'

const log = createLogger('seniority-api')

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { id } = await validateRouteParam(event, 'id', SeniorityListIdSchema)

  const cached = await getCached<SeniorityEntryResponse[]>(entriesKey(id))
  if (cached) {
    log.debug('Entries cache hit', { listId: id })
    return cached
  }

  const client = await serverSupabaseClient(event)

  const entries = await fetchAllRows(
    client
      .from('seniority_entries')
      .select('id, list_id, seniority_number, employee_number, name, seat, base, fleet, hire_date, retire_date')
      .eq('list_id', id)
      .order('seniority_number', { ascending: true }),
  ) as SeniorityEntryResponse[]

  await setCache(entriesKey(id), entries)
  log.debug('Entries fetched and cached', { listId: id, count: entries.length })

  return entries
})
