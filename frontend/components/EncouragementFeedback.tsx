'use client'

import { useEffect, useState } from 'react'

interface EncouragementFeedbackProps {
  progress: number
  isComplete: boolean
}

export default function EncouragementFeedback({ progress, isComplete }: EncouragementFeedbackProps) {
  const [message, setMessage] = useState('')
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    if (isComplete) {
      setMessage("Amazing! You finished the story!")
      setShowMessage(true)
      // Celebrate with vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 200])
      }
      return
    }

    // Show encouraging messages at milestones
    if (progress === 25) {
      setMessage("Great start! Keep going!")
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 3000)
    } else if (progress === 50) {
      setMessage("You're halfway there! Awesome!")
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 3000)
      if ('vibrate' in navigator) {
        navigator.vibrate(100)
      }
    } else if (progress === 75) {
      setMessage("Almost done! You're doing great!")
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 3000)
    }
  }, [progress, isComplete])

  if (!showMessage) return null

  return (
    <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
      <div className={`px-8 py-4 rounded-full shadow-2xl text-2xl font-bold ${
        isComplete
          ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white celebrate'
          : 'bg-gradient-to-r from-purple-400 to-pink-400 text-white'
      }`}>
        {message}
      </div>
    </div>
  )
}
