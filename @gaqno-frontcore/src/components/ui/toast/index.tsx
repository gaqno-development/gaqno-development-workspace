

import React, { useEffect } from 'react'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { useUIStore, INotification } from '../../../store/uiStore'

const ToastItem: React.FC<{ notification: INotification }> = ({ notification }) => {
  const { removeNotification } = useUIStore()

  const typeConfig = {
    success: {
      styles: 'bg-green-50 dark:bg-green-950 border-green-500 text-green-900 dark:text-green-100',
      icon: CheckCircle2,
      iconColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      styles: 'bg-red-50 dark:bg-red-950 border-red-500 text-red-900 dark:text-red-100',
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
    },
    warning: {
      styles: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-500 text-yellow-900 dark:text-yellow-100',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    info: {
      styles: 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-900 dark:text-blue-100',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  }

  const config = typeConfig[notification.type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'mb-4 flex items-start gap-3 rounded-lg border-l-4 p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-right-full',
        config.styles
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm">{notification.title}</h4>
        {notification.message && (
          <p className="mt-1 text-sm opacity-90">{notification.message}</p>
        )}
      </div>
      <button
        onClick={() => removeNotification(notification.id)}
        className="ml-2 flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity rounded p-1 hover:bg-black/5 dark:hover:bg-white/5"
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export const ToastContainer: React.FC = () => {
  const { notifications } = useUIStore()

  if (notifications.length === 0) return null

  return (
    <div
      className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2"
      aria-live="polite"
      aria-atomic="true"
    >
      {notifications.map((notification: INotification) => (
        <ToastItem key={notification.id} notification={notification} />
      ))}
    </div>
  )
}

ToastContainer.displayName = 'ToastContainer'

