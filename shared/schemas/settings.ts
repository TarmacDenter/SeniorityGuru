import { z } from 'zod'

export const UpdateProfileSchema = z.object({
  icaoCode: z.string().min(2, 'Please select your airline'),
  employeeNumber: z.string().max(20, 'Employee number is too long'),
})
export type UpdateProfileState = z.infer<typeof UpdateProfileSchema>

export const UpdatePreferencesSchema = z.object({
  mandatoryRetirementAge: z.number().int('Must be a whole number').min(55, 'Minimum age is 55').max(75, 'Maximum age is 75'),
})
export type UpdatePreferencesState = z.infer<typeof UpdatePreferencesSchema>

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
})
export type ChangePasswordState = z.infer<typeof ChangePasswordSchema>
