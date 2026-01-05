import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'

interface IUseModuleViewOptions {
  defaultView?: string
  allowedViews?: string[]
}

export const useModuleView = (options: IUseModuleViewOptions = {}) => {
  const { defaultView = 'dashboard', allowedViews } = options
  const [searchParams, setSearchParams] = useSearchParams()

  const currentView = useMemo(() => {
    const viewParam = searchParams.get('view')
    
    if (!viewParam) {
      return defaultView
    }

    if (allowedViews && !allowedViews.includes(viewParam)) {
      return defaultView
    }

    return viewParam
  }, [searchParams, defaultView, allowedViews])

  const setView = (view: string) => {
    const newParams = new URLSearchParams(searchParams)
    
    if (view === defaultView) {
      newParams.delete('view')
    } else {
      newParams.set('view', view)
    }

    setSearchParams(newParams, { replace: true })
  }

  return {
    currentView,
    setView,
  }
}

