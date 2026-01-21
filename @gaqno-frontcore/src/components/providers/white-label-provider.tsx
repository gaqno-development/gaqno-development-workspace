

import React, { useEffect } from 'react'
import { useWhiteLabel } from '@gaqno-development/frontcore/hooks'
import { applyWhiteLabelStyles } from '@gaqno-development/frontcore/utils'

export const WhiteLabelProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { config } = useWhiteLabel()

  useEffect(() => {
    if (config) {
      applyWhiteLabelStyles(config)
    }
  }, [config])

  return <>{children}</>
}

