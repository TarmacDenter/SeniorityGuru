import type { H3Event } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('admin-auth')

/** Uses service role client to bypass RLS when checking the profile role. Throws 401/403 on failure. */
export async function requireAdmin(event: H3Event) {
  const user = await serverSupabaseUser(event)
  if (!user) {
    log.warn('Unauthenticated admin request rejected')
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const client = serverSupabaseServiceRole(event)
  const { data } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.sub)
    .single()

  if (data?.role !== 'admin') {
    log.warn('Non-admin access attempt', { userId: user.sub, role: data?.role })
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return user
}
