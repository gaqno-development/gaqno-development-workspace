import { ReactElement } from 'react'
import { FieldPath, FieldValues, ControllerProps } from 'react-hook-form'

export interface IFormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName
}

export interface IFormItemContextValue {
  id: string
}

export interface IFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  render: (props: {
    field: any
    fieldState: any
    formState: any
  }) => ReactElement
}

