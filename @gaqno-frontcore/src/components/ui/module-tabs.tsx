import React from 'react'
import { Tabs, TabsList, TabsTrigger } from './tabs'
import { useModuleView } from '../../hooks/useModuleView'
import { LucideIcon } from 'lucide-react'

export interface IModuleTabConfig {
  id: string
  label: string
  icon?: LucideIcon
}

interface IModuleTabsProps {
  tabs: IModuleTabConfig[]
  defaultView?: string
  className?: string
}

export const ModuleTabs: React.FC<IModuleTabsProps> = ({
  tabs,
  defaultView = 'dashboard',
  className,
}) => {
  const { currentView, setView } = useModuleView({
    defaultView,
    allowedViews: tabs.map((tab) => tab.id),
  })

  const handleTabChange = (value: string) => {
    setView(value)
  }

  return (
    <Tabs value={currentView} onValueChange={handleTabChange} className={className}>
      <TabsList className="w-full sm:w-auto justify-start">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <TabsTrigger key={tab.id} value={tab.id}>
              {Icon && <Icon className="h-4 w-4 mr-2" />}
              {tab.label}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}

