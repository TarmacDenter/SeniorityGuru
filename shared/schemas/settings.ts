import { z } from 'zod'
import { withPasswordConfirmation } from './common'

export const UpdateProfileSchema = z.object({
  icaoCode: z.string().min(2, 'Please select your airline'),
  employeeNumber: z.string().max(20, 'Employee number is too long'),
})
export type UpdateProfileState = z.infer<typeof UpdateProfileSchema>

export const UpdatePreferencesSchema = z.object({
  mandatoryRetirementAge: z.number().int('Must be a whole number').min(55, 'Minimum age is 55').max(75, 'Maximum age is 75'),
})
export type UpdatePreferencesState = z.infer<typeof UpdatePreferencesSchema>

export const ChangePasswordSchema = withPasswordConfirmation(z.object({
  currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
}))
export type ChangePasswordState = z.infer<typeof ChangePasswordSchema>

export const ChangeEmailSchema = z.object({
  newEmail: z.string().email('Please enter a valid email address'),
})
export type ChangeEmailState = z.infer<typeof ChangeEmailSchema>

export const UpdateEmployeeNumberSchema = z.object({
  employeeNumber: z.string().min(1, 'Employee number is required').max(20),
})
export type UpdateEmployeeNumberState = z.infer<typeof UpdateEmployeeNumberSchema>
