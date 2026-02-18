import { useEffect } from 'react'
import type { BaseSyntheticEvent } from 'react'
import { useForm, FieldValues, DefaultValues, Resolver, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { handleMutationError, handleFormError } from '../../utils/error-handler'

interface IUseDialogFormOptions<T extends FieldValues, TEntity = object> {
  schema: z.ZodType<T>
  defaultValues: T
  entity?: TEntity | null
  entityToFormValues: (entity: TEntity) => T
  onCreate?: (data: T) => Promise<{ success: boolean; error?: string }>
  onUpdate?: (id: string, data: T) => Promise<{ success: boolean; error?: string }>
  getEntityId: (entity: TEntity) => string
  entityName?: string
  onSuccess?: () => void
  onClose?: () => void
  enabled?: boolean
}

export function useDialogForm<T extends FieldValues, TEntity = object>({
  schema,
  defaultValues,
  entity,
  entityToFormValues,
  onCreate,
  onUpdate,
  getEntityId,
  entityName = 'item',
  onSuccess,
  onClose,
  enabled = true,
}: IUseDialogFormOptions<T, TEntity>) {
  const form = useForm<T>({
    resolver: zodResolver(schema) as Resolver<T>,
    defaultValues: defaultValues as DefaultValues<T>,
  })

  const isEdit = !!entity

  useEffect(() => {
    if (!enabled) return

    if (entity) {
      const formValues = entityToFormValues(entity)
      form.reset(formValues)
    } else {
      form.reset(defaultValues)
    }
  }, [entity, enabled, form, entityToFormValues, defaultValues])

  const onSubmit = async (data: T) => {
    try {
      let result
      if (entity) {
        if (!onUpdate) {
          throw new Error('Update handler not provided')
        }
        result = await onUpdate(getEntityId(entity), data)
      } else {
        if (!onCreate) {
          throw new Error('Create handler not provided')
        }
        result = await onCreate(data)
      }

      if (!result.success) {
        const errorMsg = result.error || `Erro desconhecido ao salvar ${entityName}`
        handleMutationError(errorMsg, entityName)
        return
      }

      onSuccess?.()
      onClose?.()
    } catch (error) {
      handleMutationError(error, entityName)
    }
  }

  const onError = (errors: FieldErrors<T>) => {
    handleFormError(errors as FieldErrors<FieldValues>)
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit, onError) as (e?: BaseSyntheticEvent) => Promise<void>,
    isSubmitting: form.formState.isSubmitting,
    isEdit,
  }
}

