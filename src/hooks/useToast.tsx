// hooks/useToast.ts
import { useState, useCallback, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface UseToastReturn {
  toast: (options: { type: ToastType; message: string; duration?: number }) => void
  toasts: ToastMessage[]
  removeToast: (id: string) => void
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const toast = useCallback(({ type, message, duration = 5000 }: { type: ToastType; message: string; duration?: number }) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { id, type, message, duration }])
  }, [])

  useEffect(() => {
    const timers: NodeJS.Timeout[] = []
    toasts.forEach(toast => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          removeToast(toast.id)
        }, toast.duration)
        timers.push(timer)
      }
    })
    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [toasts, removeToast])

  return { toast, toasts, removeToast }
}

// Optional: Toast display component to use with the hook
export function ToastContainer({ toasts, removeToast }: { toasts: ToastMessage[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
        return 'ℹ'
    }
  }

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${getStyles(toast.type)} animate-in slide-in-from-right-5 duration-300`}
        >
          <span className="text-lg font-bold">{getIcon(toast.type)}</span>
          <p className="text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 text-current opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}