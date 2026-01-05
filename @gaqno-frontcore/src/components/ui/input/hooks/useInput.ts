import { useState } from 'react'
import { IInputProps } from '../types'

export const useInput = (props: IInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  
  const handleFocus = () => setIsFocused(true)
  const handleBlur = () => setIsFocused(false)
  
  return {
    isFocused,
    handleFocus,
    handleBlur,
  }
}

