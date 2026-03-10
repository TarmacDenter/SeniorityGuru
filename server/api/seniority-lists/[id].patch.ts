import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { SeniorityListIdSchema, UpdateSeniorityListSchema } from '#shared/schemas/seniority-list'
import { createLogger } from '#shared/utils/logger'
import { invalidateCache, listsKey, listKey } from '../../utils/seniority-cache'

const log = createLogger('seniority-api')

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    log.warn('Unauthenticated update request rejected')
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { id } = await validateRouteParam(event, 'id', SeniorityListIdSchema)
  const body = await validateBody(event, UpdateSeniorityListSchema)

  const client = await serverSupabaseClient(event)

  // RLS enforces ownership — only the uploader can update their own lists
  const { data, error } = await client
    .from('seniority_lists')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    log.warn('Update failed or list not found', { userId: user.sub, listId: id, error: error?.message })
    throw createError({ statusCode: 404, statusMessage: 'List not found' })
  }

  // Invalidate caches for this list and the user's lists index
  await invalidateCache(listsKey(user.sub), listKey(id))

  log.info('Seniority list updated', { userId: user.sub, listId: data.id })

  return data
})
