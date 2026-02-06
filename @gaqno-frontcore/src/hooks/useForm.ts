import { useForm, UseFormProps, DefaultValues, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

type Inferred<T extends z.ZodSchema> = z.infer<T>

export const useFormWithValidation = <T extends z.ZodSchema>(
  schema: T,
  defaultValues?: DefaultValues<Inferred<T>>,
  options?: Omit<UseFormProps<Inferred<T>>, 'resolver' | 'defaultValues'>
) => {
  return useForm<Inferred<T>>({
    resolver: zodResolver(schema) as Resolver<Inferred<T>>,
    defaultValues,
    ...options,
  })
}

