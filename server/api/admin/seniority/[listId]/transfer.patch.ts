import { serverSupabaseServiceRole } from '#supabase/server'
import { TransferListBodySchema, TransferListResponseSchema } from '#shared/schemas/admin'
import { createAdminLogger } from '#server/api/admin/logger'
import { z } from 'zod'

const logger = createAdminLogger('seniority/transfer')

const ListIdParamSchema = z.object({
  listId: z.string().uuid('Invalid list ID'),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const { listId } = await validateRouteParam(event, 'listId', ListIdParamSchema)
  const { targetUserId } = await validateBody(event, TransferListBodySchema)

  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
    .from('seniority_lists')
    .update({ uploaded_by: targetUserId })
    .eq('id', listId)
    .select('id, uploaded_by')
    .single()

  if (error || !data) {
    logger.error('Failed to transfer list', { listId, targetUserId, error: error?.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to transfer list' })
  }

  return parseResponse(TransferListResponseSchema, data, 'admin/seniority/[listId]/transfer.patch')
})
