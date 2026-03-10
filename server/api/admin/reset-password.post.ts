import { serverSupabaseServiceRole } from '#supabase/server'
import { ResetUserPasswordSchema } from '#shared/schemas/admin'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('admin-api')

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const { userId } = await validateBody(event, ResetUserPasswordSchema)

  const client = serverSupabaseServiceRole(event)

  // Look up user email from userId
  const { data: userData, error: userError } = await client.auth.admin.getUserById(userId)
  if (userError || !userData?.user?.email) {
    log.error('Failed to find user for password reset', { userId, error: userError?.message })
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const origin = getRequestURL(event).origin
  const { error } = await client.auth.admin.generateLink({
    type: 'recovery',
    email: userData.user.email,
    options: { redirectTo: `${origin}/auth/confirm` },
  })

  if (error) {
    log.error('Failed to generate recovery link', { userId, error: error.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to send reset email' })
  }

  log.info('Password reset triggered', { adminId: admin.sub, targetId: userId })
  return { success: true }
})
