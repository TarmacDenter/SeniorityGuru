import { serverSupabaseServiceRole } from '#supabase/server';
import { type AdminSeniorityListResponse, AdminSeniorityListResponseSchema } from '~~/shared/schemas/admin';
import { createAdminLogger } from '#server/api/admin/logger'

const logger = createAdminLogger('seniority/lists')

export default defineEventHandler(async (event): Promise<AdminSeniorityListResponse[]> => {
  await requireAdmin(event)

  const client = serverSupabaseServiceRole<Database>(event)

  const data = await fetchAllRows(
    client
      .from('seniority_lists')
      .select('*')
      .order('created_at', { ascending: false }),
    'admin/seniority/lists',
  ).catch((err) => {
    logger.error('Failed to fetch seniority lists', { error: err.message })
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch seniority lists' })
  })

  return parseResponse(AdminSeniorityListResponseSchema.array(), data, 'admin/seniority/lists.get') satisfies AdminSeniorityListResponse[]
})