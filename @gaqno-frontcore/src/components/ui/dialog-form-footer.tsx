import { Button } from './button'
import { DialogFooter } from './dialog'

interface IDialogFormFooterProps {
  onCancel: () => void
  isSubmitting: boolean
  submitLabel?: string
  cancelLabel?: string
  isEdit?: boolean
  isValid?: boolean
}

export function DialogFormFooter({
  onCancel,
  isSubmitting,
  submitLabel,
  cancelLabel = 'Cancelar',
  isEdit = false,
  isValid = true,
}: IDialogFormFooterProps) {
  const defaultSubmitLabel = isEdit ? 'Atualizar' : 'Criar'
  const finalSubmitLabel = submitLabel || defaultSubmitLabel

  return (
    <DialogFooter>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </Button>
      <Button 
        type="submit" 
        variant="default"
        disabled={isSubmitting || !isValid}
      >
        {isSubmitting ? 'Salvando...' : finalSubmitLabel}
      </Button>
    </DialogFooter>
  )
}

