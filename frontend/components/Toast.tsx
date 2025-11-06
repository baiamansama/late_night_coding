'use client'

import { useEffect, useState } from 'react'
import { Check, PartyPopper, Star } from 'lucide-react'

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
    <div
      className="fixed top-4 right-4 z-[1000] flex flex-col gap-3 max-w-md"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const duration = toast.duration ?? 4000
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onRemove(toast.id), prefersReduced ? 0 : 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const styles = {
    success: 'from-green-400 to-green-500',
    celebration: 'from-yellow-400 via-pink-400 to-purple-500',
    encouragement: 'from-blue-400 to-purple-400',
    info: 'from-blue-500 to-blue-600',
  } as const

  const getToastStyles = () => `bg-gradient-to-r ${styles[toast.type] ?? styles.info} text-white`

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <Check className="w-8 h-8" />
      case 'celebration': return <PartyPopper className="w-8 h-8" />
      case 'encouragement': return <Star className="w-8 h-8" />
      default: return <Star className="w-8 h-8" />
    }
  }

  return (
    <div
      className={`${getToastStyles()} rounded-2xl shadow-2xl p-4 flex items-center gap-3 transform transition-all duration-300 ${
        isExiting ? 'translate-x-96 opacity-0' : 'translate-x-0 opacity-100'
      }`}
      style={{ animation: isExiting ? 'none' : 'slideInRight 0.4s ease-out' }}
      role="status"
      aria-live="polite"
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="flex-1">
        <p className="text-lg font-semibold">{toast.message}</p>
      </div>
      <button
        onClick={() => {
          setIsExiting(true)
          setTimeout(() => onRemove(toast.id), 300)
        }}
        className="text-white/80 hover:text-white text-2xl font-bold leading-none"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  )
}

// Hook to manage toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (
    message: string,
    type: ToastMessage['type'] = 'info',
    duration?: number,
    icon?: string
  ) => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type, duration, icon }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess: (m: string, d?: number) => addToast(m, 'success', d),
    showCelebration: (m: string, d?: number) => addToast(m, 'celebration', d),
    showEncouragement: (m: string, d?: number) => addToast(m, 'encouragement', d),
  }
}
