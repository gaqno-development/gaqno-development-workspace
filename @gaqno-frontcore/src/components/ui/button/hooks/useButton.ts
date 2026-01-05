import { useState } from 'react'
import { IButtonProps } from '../types'

export const useButton = (props: IButtonProps) => {
  const [isPressed, setIsPressed] = useState(false)
  
  const handleMouseDown = () => setIsPressed(true)
  const handleMouseUp = () => setIsPressed(false)
  
  return {
    isPressed,
    handleMouseDown,
    handleMouseUp,
  }
}

