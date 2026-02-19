import React from "react"
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "../../../lib/utils"
import { useUIStore, INotification } from "../../../store/uiStore"

const ToastItem: React.FC<{ notification: INotification }> = ({ notification }) => {
  const { removeNotification } = useUIStore()

  const typeConfig = {
    success: {
      styles: "bg-primary text-primary-foreground border-primary",
      icon: CheckCircle2,
      iconColor: "text-primary-foreground",
    },
    error: {
      styles: "bg-destructive text-destructive-foreground border-destructive",
      icon: AlertCircle,
      iconColor: "text-destructive-foreground",
    },
    warning: {
      styles: "bg-muted text-muted-foreground border-muted-foreground/50",
      icon: AlertTriangle,
      iconColor: "text-muted-foreground",
    },
    info: {
      styles: "bg-muted text-muted-foreground border-border",
      icon: Info,
      iconColor: "text-foreground",
    },
  }

  const config = typeConfig[notification.type]
  const Icon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "mb-4 flex items-start gap-3 rounded-lg border-l-4 p-4 shadow-lg",
        config.styles
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconColor)} />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm">{notification.title}</h4>
        {notification.message && (
          <p className="mt-1 text-sm opacity-90">{notification.message}</p>
        )}
      </div>
      <button
        onClick={() => removeNotification(notification.id)}
        className="ml-2 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity rounded p-1 hover:bg-foreground/10"
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
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
      <AnimatePresence>
        {notifications.map((notification: INotification) => (
          <ToastItem key={notification.id} notification={notification} />
        ))}
      </AnimatePresence>
    </div>
  )
}

ToastContainer.displayName = 'ToastContainer'

