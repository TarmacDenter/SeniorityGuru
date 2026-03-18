import { serverSupabaseServiceRole } from '#supabase/server'
import { createAdminLogger } from '#server/api/admin/logger'
import { z } from 'zod'

const logger = createAdminLogger('seniority/delete')

const ListIdParamSchema = z.object({
  listId: z.string().uuid('Invalid list ID'),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const { listId } = await validateRouteParam(event, 'listId', ListIdParamSchema)

  const client = serverSupabaseServiceRole(event)

  const { error } = await client
    .from('seniority_lists')
    .delete()
    .eq('id', listId)

  if (error) {
    logger.error('Failed to delete list', { listId, error: error.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete list' })
  }

  setResponseStatus(event, 204)
  return null
})
