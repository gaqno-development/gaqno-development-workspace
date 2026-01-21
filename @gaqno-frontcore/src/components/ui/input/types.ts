import { InputHTMLAttributes } from 'react'

export interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  showAISuggest?: boolean
  onAISuggest?: () => void | Promise<void>
  isAIGenerating?: boolean
  aiSuggestLabel?: string
}

