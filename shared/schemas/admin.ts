import { z } from 'zod'
import { uuidField } from './common'

export const UpdateUserRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
})
export type UpdateUserRole = z.infer<typeof UpdateUserRoleSchema>

export const InviteUserSchema = z.object({
  email: z.string().email(),
})
export type InviteUser = z.infer<typeof InviteUserSchema>

export const ResetUserPasswordSchema = z.object({
  userId: uuidField(),
})
export type ResetUserPassword = z.infer<typeof ResetUserPasswordSchema>

export const AdminUserIdSchema = z.object({
  id: uuidField(),
})
export type AdminUserId = z.infer<typeof AdminUserIdSchema>

export const AdminGetUsersSeniorityListCountResponse = z.array(z.object({
  count: z.number().int().nonnegative(),
  userId: uuidField(),
}));

export type AdminGetUsersSeniorityListCountResponse = z.infer<typeof AdminGetUsersSeniorityListCountResponse>

// --- Activity Feed ---

export const AdminActivityItemSchema = z.object({
  id: z.string().uuid(),
  event_type: z.enum(['user_signup', 'list_upload']),
  actor_email: z.string().email().nullable(),
  metadata: z.record(z.unknown()),
  created_at: z.string(),
})
export const AdminActivityResponseSchema = AdminActivityItemSchema.array()
export type AdminActivityResponse = z.infer<typeof AdminActivityResponseSchema>

// --- Stats ---

export const AdminStatsResponseSchema = z.object({
  total_users: z.number(),
  users_by_role: z.object({ user: z.number(), admin: z.number() }),
  total_lists: z.number(),
  total_entries: z.number(),
  recent_signups: z.array(z.object({
    id: z.string().uuid(),
    email: z.string().email().nullable(),
    created_at: z.string(),
    icao_code: z.string().nullable(),
  })),
})
export type AdminStatsResponse = z.infer<typeof AdminStatsResponseSchema>

// --- Transfer List Ownership ---

export const TransferListBodySchema = z.object({
  targetUserId: z.string().uuid(),
})
export type TransferListBody = z.infer<typeof TransferListBodySchema>

export const TransferListResponseSchema = z.object({
  id: z.string().uuid(),
  uploaded_by: z.string().uuid(),
})
export type TransferListResponse = z.infer<typeof TransferListResponseSchema>

// --- Single User Detail ---

export const AdminUserDetailSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  created_at: z.string(),
  last_sign_in_at: z.string().nullable(),
  role: z.enum(['user', 'admin', 'moderator']),
  icao_code: z.string().nullable(),
  employee_number: z.string().nullable(),
})
export type AdminUserDetail = z.infer<typeof AdminUserDetailSchema>