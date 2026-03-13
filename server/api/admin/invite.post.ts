import { serverSupabaseServiceRole } from '#supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { InviteUserSchema } from '#shared/schemas/admin'
import { createAdminLogger } from '#server/api/admin/logger'

const log = createAdminLogger('invite')

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const { email } = await validateBody(event, InviteUserSchema)

  const client = serverSupabaseServiceRole(event)
  const redirectTo = `${getRequestURL(event).origin}/auth/confirm`

  const { error } = await client.auth.admin.inviteUserByEmail(email, { redirectTo })

  if (!error) {
    log.info('User invited', { adminId: admin.sub, email })
    return { success: true }
  }

  if (error.message.includes('already been registered')) {
    return await handleReinvite(client, email, redirectTo, admin.sub)
  }

  log.error('Failed to invite user', { adminId: admin.sub, email, error: error.message })
  throw createError({ statusCode: 500, statusMessage: 'Failed to invite user' })
})

async function handleReinvite(client: SupabaseClient, email: string, redirectTo: string, adminId: string) {
  const { data: { users }, error: listError } = await client.auth.admin.listUsers({ perPage: 1000 })

  if (listError || !users) {
    log.error('Failed to look up existing user for re-invite', { adminId, email })
    throw createError({ statusCode: 500, statusMessage: 'Failed to invite user' })
  }

  const existingUser = users.find(u => u.email === email)

  if (!existingUser) {
    log.error('User reported as registered but not found', { adminId, email })
    throw createError({ statusCode: 500, statusMessage: 'Failed to invite user' })
  }

  if (existingUser.last_sign_in_at) {
    log.warn('Attempted to invite existing active user', { adminId, email })
    throw createError({ statusCode: 409, statusMessage: 'User is already active' })
  }

  const { error: deleteError } = await client.auth.admin.deleteUser(existingUser.id)
  if (deleteError) {
    log.error('Failed to delete incomplete user for re-invite', { adminId, email, error: deleteError.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to invite user' })
  }

  const { error: reinviteError } = await client.auth.admin.inviteUserByEmail(email, { redirectTo })
  if (reinviteError) {
    log.error('Failed to re-invite user', { adminId, email, error: reinviteError.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to invite user' })
  }

  log.info('User re-invited (previous incomplete registration cleared)', { adminId, email })
  return { success: true }
}
