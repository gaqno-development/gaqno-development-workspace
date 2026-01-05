// @ts-nocheck
import { useForm, UseFormProps, DefaultValues, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

export const useFormWithValidation = <T extends z.ZodSchema>(
  schema: T,
  defaultValues?: DefaultValues<z.infer<T>>,
  options?: Omit<UseFormProps<z.infer<T>>, 'resolver' | 'defaultValues'>
) => {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema) as Resolver<z.infer<T>>,
    defaultValues: defaultValues as DefaultValues<T>,
    ...options,
  })
}

