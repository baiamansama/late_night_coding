'use client'

import { useEffect, useState } from 'react'

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'info' | 'celebration' | 'encouragement'
  duration?: number
  icon?: string
}

interface ToastProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const duration = toast.duration || 4000

    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onRemove(toast.id), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-gradient-to-r from-green-400 to-green-500 text-white'
      case 'celebration':
        return 'bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 text-white animate-pulse'
      case 'encouragement':
        return 'bg-gradient-to-r from-blue-400 to-purple-400 text-white'
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
    }
  }

  const icon = toast.icon || (toast.type === 'success' ? '✓' : toast.type === 'celebration' ? '🎉' : '⭐')

  return (
    <div
      className={`${getToastStyles()} rounded-2xl shadow-2xl p-4 flex items-center gap-3 transform transition-all duration-300 ${
        isExiting ? 'translate-x-96 opacity-0' : 'translate-x-0 opacity-100'
      }`}
      style={{ animation: isExiting ? 'none' : 'slideInRight 0.4s ease-out' }}
    >
      <div className="text-3xl flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="text-lg font-semibold">{toast.message}</p>
      </div>
      <button
        onClick={() => {
          setIsExiting(true)
          setTimeout(() => onRemove(toast.id), 300)
        }}
        className="text-white/80 hover:text-white text-2xl font-bold leading-none"
      >
        ×
      </button>
    </div>
  )
}

// Hook to manage toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (message: string, type: ToastMessage['type'] = 'info', duration?: number, icon?: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type, duration, icon }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess: (message: string, duration?: number) => addToast(message, 'success', duration, '✓'),
    showCelebration: (message: string, duration?: number) => addToast(message, 'celebration', duration, '🎉'),
    showEncouragement: (message: string, duration?: number) => addToast(message, 'encouragement', duration, '⭐'),
  }
}
