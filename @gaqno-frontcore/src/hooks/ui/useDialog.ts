import { useState, useCallback } from 'react'

export const useDialog = <T = any>() => {
    const [isOpen, setIsOpen] = useState(false)
    const [data, setData] = useState<T | null>(null)

    const open = useCallback((dialogData?: T) => {
        if (dialogData) {
            setData(dialogData)
        }
        setIsOpen(true)
    }, [])

    const close = useCallback(() => {
        setIsOpen(false)
        setData(null)
    }, [])

    return {
        isOpen,
        data,
        open,
        close
    }
}

