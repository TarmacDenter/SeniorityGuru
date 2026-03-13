import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { SeniorityListIdSchema, SeniorityEntryResponseSchema } from '#shared/schemas/seniority-list'
import { createLogger } from '#shared/utils/logger'
import { fetchAllRows } from '../../../utils/fetchAllRows'
import { parseResponse } from '../../../utils/validation'
import type { Database } from '#shared/types/database'

const log = createLogger('seniority-api')

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { id } = await validateRouteParam(event, 'id', SeniorityListIdSchema)

  const client = await serverSupabaseClient<Database>(event)

  const entries = await fetchAllRows(
    client
      .from('seniority_entries')
      .select('id, list_id, seniority_number, employee_number, name, seat, base, fleet, hire_date, retire_date')
      .eq('list_id', id)
      .order('seniority_number', { ascending: true }),
    `seniority-lists/${id}/entries`,
  ).catch((err) => {
    log.error('Failed to fetch seniority entries', { listId: id, error: err.message })
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch seniority entries' })
  })

  return parseResponse(SeniorityEntryResponseSchema.array(), entries, 'seniority-lists/[id]/entries.get')
})
