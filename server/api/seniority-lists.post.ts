import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { CreateSeniorityListSchema, CreateSeniorityListResponseSchema } from '#shared/schemas/seniority-list'
import { createLogger } from '#shared/utils/logger'
import { parseResponse } from '../utils/validation'
import type { Database } from '#shared/types/database'

const log = createLogger('seniority-api')

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    log.warn('Unauthenticated request rejected')
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { entries, effective_date, title } = await validateBody(event, CreateSeniorityListSchema)

  log.info('Seniority list upload started', {
    userId: user.sub,
    effectiveDate: effective_date,
    entryCount: entries.length,
  })

  const client = await serverSupabaseClient<Database>(event)

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('icao_code')
    .eq('id', user.sub)
    .single()

  if (profileError) {
    log.error('Profile lookup failed', { userId: user.sub, error: profileError.message })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
  if (!profile?.icao_code) {
    log.warn('No airline set on profile', { userId: user.sub })
    throw createError({ statusCode: 400, statusMessage: 'No airline set on profile' })
  }

  const { data: list, error: listError } = await client
    .from('seniority_lists')
    .insert({
      airline: profile.icao_code,
      effective_date,
      uploaded_by: user.sub,
      ...(title && { title }),
    })
    .select('id')
    .single()

  if (listError || !list) {
    log.error('List insert failed', { userId: user.sub, error: listError?.message })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }

  const mappedEntries = entries.map((entry) => ({
    list_id: list.id,
    ...entry,
  }))

  const { error: entriesError } = await client
    .from('seniority_entries')
    .insert(mappedEntries)

  if (entriesError) {
    log.error('Entries insert failed', { userId: user.sub, listId: list.id, error: entriesError.message })
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }

  log.info('Seniority list upload completed', {
    userId: user.sub,
    listId: list.id,
    entryCount: entries.length,
    airline: profile.icao_code,
  })

  return parseResponse(CreateSeniorityListResponseSchema, { id: list.id, count: entries.length }, 'seniority-lists.post')
})
