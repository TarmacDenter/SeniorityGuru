import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { CreateSeniorityListSchema } from '#shared/schemas/seniority-list'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const parsed = CreateSeniorityListSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation failed',
      data: parsed.error.issues,
    })
  }

  const client = await serverSupabaseClient(event)

  // Get the user's airline from their profile
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('icao_code')
    .eq('id', user.sub)
    .single()

  if (profileError) {
    console.error('[seniority-lists] profile lookup failed:', profileError.message)
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
  if (!profile?.icao_code) {
    throw createError({ statusCode: 400, statusMessage: 'No airline set on profile' })
  }

  // Create the seniority list
  const { data: list, error: listError } = await client
    .from('seniority_lists')
    .insert({
      airline: profile.icao_code,
      effective_date: parsed.data.effective_date,
      uploaded_by: user.sub,
    })
    .select('id')
    .single()

  if (listError || !list) {
    console.error('[seniority-lists] list insert failed:', listError?.message)
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }

  // Batch insert entries
  const entries = parsed.data.entries.map((entry) => ({
    list_id: list.id,
    ...entry,
  }))

  const { error: entriesError } = await client
    .from('seniority_entries')
    .insert(entries)

  if (entriesError) {
    console.error('[seniority-lists] entries insert failed:', entriesError.message)
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }

  return { id: list.id, count: entries.length }
})
