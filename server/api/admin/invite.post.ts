import { serverSupabaseServiceRole } from '#supabase/server'
import { InviteUserSchema } from '#shared/schemas/admin'
import { createLogger } from '#shared/utils/logger'

const log = createLogger('admin-api')

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const body = await readBody(event)
  const parsed = InviteUserSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: parsed.error.issues })
  }

  const client = serverSupabaseServiceRole(event)
  const origin = getRequestURL(event).origin

  const { error } = await client.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/confirm`,
  })

  if (error) {
    log.error('Failed to invite user', { adminId: admin.sub, email: parsed.data.email, error: error.message })
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  log.info('User invited', { adminId: admin.sub, email: parsed.data.email })
  return { success: true }
})
