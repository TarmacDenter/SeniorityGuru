import { z } from 'zod'

export const UpdateEmployeeNumberSchema = z.object({
  employeeNumber: z.string().min(1, 'Employee number is required').max(20),
})
export type UpdateEmployeeNumberState = z.infer<typeof UpdateEmployeeNumberSchema>
