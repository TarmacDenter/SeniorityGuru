import { z } from 'zod'
import { withPasswordConfirmation } from './common'

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
export type LoginState = z.infer<typeof LoginSchema>

export const SignUpSchema = withPasswordConfirmation(z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
  icaoCode: z.string().optional(),
}))
export type SignUpState = z.infer<typeof SignUpSchema>

export const SetupProfileSchema = z.object({
  icaoCode: z.string().min(2, 'Please select your airline'),
})
export type SetupProfileState = z.infer<typeof SetupProfileSchema>

export const ResetPasswordSchema = z.object({ email: z.string().email() })
export type ResetPasswordState = z.infer<typeof ResetPasswordSchema>

export const RecoveryPasswordSchema = withPasswordConfirmation(z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
}))
export type RecoveryPasswordState = z.infer<typeof RecoveryPasswordSchema>

export const ResendEmailSchema = z.object({ email: z.string().email() })
export type ResendEmailState = z.infer<typeof ResendEmailSchema>
