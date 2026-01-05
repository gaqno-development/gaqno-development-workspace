export interface IErrorResult {
  success: false
  error: string
}

export interface ISuccessResult<T = void> {
  success: true
  data?: T
}

export type IResult<T = void> = ISuccessResult<T> | IErrorResult

export const handleError = (error: unknown, defaultMessage: string = 'Erro desconhecido'): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return defaultMessage
}

export const showErrorAlert = (message: string, prefix: string = 'Erro'): void => {
  if (typeof window !== 'undefined') {
    alert(`${prefix}: ${message}`)
  }
}

export const handleFormError = (errors: Record<string, any>): void => {
  const firstError = Object.values(errors)[0] as any
  if (firstError?.message) {
    showErrorAlert(firstError.message, 'Por favor, corrija os erros no formulário')
  }
}

export const handleMutationError = (error: unknown, entityName: string = 'item'): void => {
  const errorMessage = handleError(error, `Erro desconhecido ao salvar ${entityName}`)
  console.error(`${entityName} save failed:`, errorMessage)
  showErrorAlert(errorMessage, `Erro ao salvar ${entityName}`)
}

