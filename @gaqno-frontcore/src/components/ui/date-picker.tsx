

import { Input } from './input'
import { Label } from './label'
import { cn } from '../../lib/utils'

interface IDatePickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
  label,
}: IDatePickerProps) {
  return (
    <div className={cn('space-y-2', !label && 'flex items-end')}>
      {label && <Label htmlFor={`date-${label}`}>{label}</Label>}
      <Input
        id={label ? `date-${label}` : undefined}
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('w-full', className)}
      />
    </div>
  )
}

