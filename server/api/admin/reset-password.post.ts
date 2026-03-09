import { serverSupabaseServiceRole } from '#supabase/server'
import { ResetUserPasswordSchema } from '#shared/schemas/admin'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('admin-api')

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const body = await readBody(event)
  const parsed = ResetUserPasswordSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: parsed.error.issues })
  }

  const client = serverSupabaseServiceRole(event)

  // Look up user email from userId
  const { data: userData, error: userError } = await client.auth.admin.getUserById(parsed.data.userId)
  if (userError || !userData?.user?.email) {
    log.error('Failed to find user for password reset', { userId: parsed.data.userId, error: userError?.message })
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const origin = getRequestURL(event).origin
  const { error } = await client.auth.admin.generateLink({
    type: 'recovery',
    email: userData.user.email,
    options: { redirectTo: `${origin}/auth/confirm` },
  })

  if (error) {
    log.error('Failed to generate recovery link', { userId: parsed.data.userId, error: error.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to send reset email' })
  }

  log.info('Password reset triggered', { adminId: admin.sub, targetId: parsed.data.userId })
  return { success: true }
})
