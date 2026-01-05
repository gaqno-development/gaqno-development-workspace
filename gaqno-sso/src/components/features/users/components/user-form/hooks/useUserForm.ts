import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userFormSchema, IUserFormValues } from '../schema'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@gaqno-dev/frontcore/lib/api'
import { IUserFormProps } from '../types'

export const useUserForm = (props: IUserFormProps) => {
  const queryClient = useQueryClient()
  
  const form = useForm<IUserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: props.user?.name || '',
      role: props.user?.role || undefined,
      department: props.user?.department || '',
      avatar_url: props.user?.avatar_url || '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: IUserFormValues) => {
      if (!props.user) throw new Error('User ID is required')
      return api.users.update(props.user.user_id, values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      form.reset()
      props.onSuccess?.()
    },
    onError: (error: Error) => {
      form.setError('root', {
        message: error.message || 'Erro ao atualizar usuário',
      })
    },
  })

  const onSubmit = form.handleSubmit((data) => {
    updateMutation.mutate(data)
  })

  return {
    form,
    onSubmit,
    isSubmitting: updateMutation.isPending,
    error: form.formState.errors.root?.message,
  }
}

