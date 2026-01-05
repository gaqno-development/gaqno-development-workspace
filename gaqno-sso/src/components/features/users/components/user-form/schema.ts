import { z } from 'zod'
import { UserRole } from '@gaqno-dev/frontcore/types/user'

export const userFormSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Selecione uma função válida' }),
  }),
  department: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
})

export type IUserFormValues = z.infer<typeof userFormSchema>

