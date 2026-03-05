import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
export type LoginState = z.infer<typeof LoginSchema>

export const SignUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
  icaoCode: z.string().optional(),   // optional at signup; required to enter app
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
})
export type SignUpState = z.infer<typeof SignUpSchema>

export const SetupProfileSchema = z.object({
  icaoCode: z.string().min(2, 'Please select your airline'),
})
export type SetupProfileState = z.infer<typeof SetupProfileSchema>

export const ResetPasswordSchema = z.object({ email: z.string().email() })
export type ResetPasswordState = z.infer<typeof ResetPasswordSchema>

export const UpdatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
})
export type UpdatePasswordState = z.infer<typeof UpdatePasswordSchema>

export const ResendEmailSchema = z.object({ email: z.string().email() })
export type ResendEmailState = z.infer<typeof ResendEmailSchema>
