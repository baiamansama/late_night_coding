'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  progress: number  // 0-100
  isComplete: boolean
}

export default function EncouragementFeedback({ progress, isComplete }: Props) {
  const [message, setMessage] = useState('')
  const [show, setShow] = useState(false)

  const shown25 = useRef(false)
  const shown50 = useRef(false)
  const shown75 = useRef(false)

  useEffect(() => {
    if (isComplete) {
      setMessage('Amazing! You finished the story!')
      setShow(true)
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 200])
      return
    }

    const showTemp = (msg: string) => {
      setMessage(msg)
      setShow(true)
      const t = setTimeout(() => setShow(false), 3000)
      return () => clearTimeout(t)
    }

    let cleanup: (() => void) | undefined

    if (progress >= 25 && !shown25.current) {
      shown25.current = true
      cleanup = showTemp('Great start! Keep going!')
    } else if (progress >= 50 && !shown50.current) {
      shown50.current = true
      if ('vibrate' in navigator) navigator.vibrate(100)
      cleanup = showTemp("You're halfway there! Awesome!")
    } else if (progress >= 75 && !shown75.current) {
      shown75.current = true
      cleanup = showTemp("Almost done! You're doing great!")
    }

    return cleanup
  }, [progress, isComplete])

  if (!show) return null

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div className={`px-8 py-4 rounded-full shadow-2xl text-2xl font-bold ${
        isComplete
          ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white'
          : 'bg-gradient-to-r from-purple-400 to-pink-400 text-white'
      }`}>
        {message}
      </div>
    </div>
  )
}
