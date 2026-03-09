import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { SeniorityListIdSchema } from '#shared/schemas/seniority-list'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('seniority-api')

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    log.warn('Unauthenticated delete request rejected')
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const parsed = SeniorityListIdSchema.safeParse({ id: getRouterParam(event, 'id') })
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid list ID', data: parsed.error.issues })
  }

  const client = await serverSupabaseClient(event)

  // RLS enforces ownership — only the uploader can delete their own lists
  const { data, error } = await client
    .from('seniority_lists')
    .delete()
    .eq('id', parsed.data.id)
    .select('id')
    .single()

  if (error || !data) {
    log.warn('Delete failed or list not found', { userId: user.sub, listId: parsed.data.id, error: error?.message })
    throw createError({ statusCode: 404, statusMessage: 'List not found' })
  }

  log.info('Seniority list deleted', { userId: user.sub, listId: data.id })

  setResponseStatus(event, 204)
  return null
})
