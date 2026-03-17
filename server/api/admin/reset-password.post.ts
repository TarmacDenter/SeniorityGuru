import { serverSupabaseServiceRole } from '#supabase/server'
import { ResetUserPasswordSchema } from '#shared/schemas/admin'
import { createAdminLogger } from '#server/api/admin/logger'

const log = createAdminLogger('reset-password')

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const { userId } = await validateBody(event, ResetUserPasswordSchema)

  const client = serverSupabaseServiceRole(event)

  const { data: userData, error: userError } = await client.auth.admin.getUserById(userId)
  if (userError || !userData?.user?.email) {
    log.error('Failed to find user for password reset', { userId, error: userError?.message })
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const origin = getRequestURL(event).origin
  const { error } = await client.auth.resetPasswordForEmail(userData.user.email, {
    redirectTo: `${origin}/auth/confirm?type=recovery`,
  })

  if (error) {
    log.error('Failed to send recovery email', { userId, error: error.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to send reset email' })
  }

  log.info('Password reset triggered', { adminId: admin.sub, targetId: userId })
  return { success: true }
})
