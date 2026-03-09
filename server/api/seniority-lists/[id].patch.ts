import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { SeniorityListIdSchema, UpdateSeniorityListSchema } from '#shared/schemas/seniority-list'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('seniority-api')

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    log.warn('Unauthenticated update request rejected')
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const idParsed = SeniorityListIdSchema.safeParse({ id: getRouterParam(event, 'id') })
  if (!idParsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid list ID', data: idParsed.error.issues })
  }

  const body = await readBody(event)
  const bodyParsed = UpdateSeniorityListSchema.safeParse(body)
  if (!bodyParsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: bodyParsed.error.issues })
  }

  const client = await serverSupabaseClient(event)

  // RLS enforces ownership — only the uploader can update their own lists
  const { data, error } = await client
    .from('seniority_lists')
    .update(bodyParsed.data)
    .eq('id', idParsed.data.id)
    .select()
    .single()

  if (error || !data) {
    log.warn('Update failed or list not found', { userId: user.sub, listId: idParsed.data.id, error: error?.message })
    throw createError({ statusCode: 404, statusMessage: 'List not found' })
  }

  log.info('Seniority list updated', { userId: user.sub, listId: data.id })

  return data
})
