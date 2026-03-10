import { serverSupabaseServiceRole } from '#supabase/server'
import { InviteUserSchema } from '#shared/schemas/admin'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('admin-api')

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const { email } = await validateBody(event, InviteUserSchema)

  const client = serverSupabaseServiceRole(event)
  const origin = getRequestURL(event).origin

  const { error } = await client.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/confirm`,
  })

  if (error) {
    log.error('Failed to invite user', { adminId: admin.sub, email, error: error.message })
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  log.info('User invited', { adminId: admin.sub, email })
  return { success: true }
})
