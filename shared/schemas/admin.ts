import { z } from 'zod'
import { uuidField } from './common'

export const UpdateUserRoleSchema = z.object({
  role: z.enum(['user', 'moderator', 'admin']),
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
