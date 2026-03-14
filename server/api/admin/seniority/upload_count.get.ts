import { serverSupabaseServiceRole } from '#supabase/server';
import type { Tables } from '#shared/types/database';
import type z from 'zod';
import { createAdminLogger } from '../logger';
import { AdminGetUsersSeniorityListCountResponse } from '~~/shared/schemas/admin';

const logger = createAdminLogger('seniority/upload_count');

export type AdminGetUsersSeniorityListCountResponseDto = z.infer<typeof AdminGetUsersSeniorityListCountResponse>

const mapToDto = (data: Tables<'user_count_uploads'>): AdminGetUsersSeniorityListCountResponseDto[number] => {
  return {
    userId: data.user_id!,
    count: data.count!,
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const client = serverSupabaseServiceRole<Database>(event);
  
  const data = await fetchAllRows(
    client.from('user_count_uploads').select('*')
  , 'admin/seniority/upload_count')
  .then(d => d.map(mapToDto))
  .catch((err) => {
    logger.error('Failed to fetch user count uploads', { error: err.message })
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch user count uploads' })
  })

  return parseResponse(AdminGetUsersSeniorityListCountResponse, data, 'admin/seniority/upload_count.get')
})