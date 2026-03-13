import { serverSupabaseServiceRole } from '#supabase/server'
import { type SeniorityEntryResponse, SeniorityEntryResponseSchema } from '~~/shared/schemas/seniority-list'
import { createAdminLogger } from '#server/api/admin/logger'

const logger = createAdminLogger('seniority/entries')
import { z } from 'zod'

const ListIdParamSchema = z.object({
  listId: z.string().uuid('Invalid list ID'),
})

export default defineEventHandler(async (event): Promise<SeniorityEntryResponse[]> => {
  await requireAdmin(event)

  const { listId } = await validateRouteParam(event, 'listId', ListIdParamSchema)

  const client = await serverSupabaseServiceRole<Database>(event)

  const entries = await fetchAllRows(
    client
      .from('seniority_entries')
      .select('id, list_id, seniority_number, employee_number, name, seat, base, fleet, hire_date, retire_date')
      .eq('list_id', listId)
      .order('seniority_number', { ascending: true }),
    `admin/seniority/${listId}/entries`,
  ).catch((err) => {
    logger.error('Failed to fetch seniority entries', { listId, error: err.message })
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch seniority entries' })
  })

  return parseResponse(SeniorityEntryResponseSchema.array(), entries, 'admin/seniority/[listId]/entries.get') satisfies SeniorityEntryResponse[]
})
