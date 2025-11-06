'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ResultsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const sessionId = params?.sessionId as string
  const score = parseInt(searchParams?.get('score') || '0')
  const total = parseInt(searchParams?.get('total') || '5')

  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    // Show confetti animation
    setShowConfetti(true)

    // Vibrate for celebration
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 200, 50, 300])
    }

    // Hide confetti after animation
    setTimeout(() => setShowConfetti(false), 5000)
  }, [])

  const percentage = Math.round((score / total) * 100)

  const getMessage = () => {
    if (percentage >= 90) {
      return {
        emoji: '🌟',
        title: 'Outstanding!',
        message: 'You really understood the story!',
        color: 'from-yellow-400 to-orange-400'
      }
    } else if (percentage >= 80) {
      return {
        emoji: '🎉',
        title: 'Excellent Work!',
        message: 'You did a great job!',
        color: 'from-green-400 to-blue-400'
      }
    } else if (percentage >= 70) {
      return {
        emoji: '👏',
        title: 'Good Job!',
        message: 'You understood most of the story!',
        color: 'from-blue-400 to-purple-400'
      }
    } else if (percentage >= 60) {
      return {
        emoji: '💪',
        title: 'Nice Try!',
        message: 'Keep practicing, you\'re improving!',
        color: 'from-purple-400 to-pink-400'
      }
    } else {
      return {
        emoji: '🌱',
        title: 'Keep Going!',
        message: 'Every story you read makes you better!',
        color: 'from-pink-400 to-red-400'
      }
    }
  }

  const result = getMessage()

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Confetti animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                fontSize: '2rem'
              }}
            >
              {['🎉', '⭐', '🌟', '✨', '🎊'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      <div className="text-center space-y-8">
        {/* Main Result Card */}
        <div className={`bg-gradient-to-br ${result.color} rounded-3xl shadow-2xl p-12 text-white relative overflow-hidden`}>
          <div className="relative z-10">
            <div className="text-9xl mb-6 animate-bounce">
              {result.emoji}
            </div>
            <h1 className="text-6xl font-bold mb-4">
              {result.title}
            </h1>
            <p className="text-3xl mb-8">
              {result.message}
            </p>

            {/* Score Display */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 inline-block">
              <div className="text-8xl font-bold mb-2">
                {score}/{total}
              </div>
              <div className="text-2xl">
                {percentage}% Correct
              </div>
            </div>
          </div>

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full translate-y-48 -translate-x-48"></div>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Your Reading Stats
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="p-6 bg-purple-50 rounded-2xl">
              <div className="text-5xl font-bold text-purple-600 mb-2">
                {score}
              </div>
              <div className="text-xl text-gray-600">
                Correct
              </div>
            </div>
            <div className="p-6 bg-blue-50 rounded-2xl">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {total - score}
              </div>
              <div className="text-xl text-gray-600">
                Missed
              </div>
            </div>
            <div className="p-6 bg-green-50 rounded-2xl">
              <div className="text-5xl font-bold text-green-600 mb-2">
                {percentage}%
              </div>
              <div className="text-xl text-gray-600">
                Score
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Achievements Unlocked! 🏆
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {score >= 1 && (
              <div className="p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl">
                <div className="text-4xl mb-2">📚</div>
                <div className="font-semibold">Story Reader</div>
              </div>
            )}
            {score >= 3 && (
              <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl">
                <div className="text-4xl mb-2">🧠</div>
                <div className="font-semibold">Quick Thinker</div>
              </div>
            )}
            {score >= 4 && (
              <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl">
                <div className="text-4xl mb-2">⭐</div>
                <div className="font-semibold">Super Reader</div>
              </div>
            )}
            {score === total && (
              <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl">
                <div className="text-4xl mb-2">🏆</div>
                <div className="font-semibold">Perfect Score!</div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-full text-2xl font-bold shadow-lg hover:scale-105 transition-all"
          >
            Read Another Story
          </Link>
        </div>

        {/* Encouraging Message */}
        <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-3xl p-8">
          <p className="text-2xl text-gray-700 font-medium">
            {percentage >= 80
              ? "Keep up the amazing work! You're becoming a better reader every day!"
              : "Remember, every story you read helps you become a better reader. Keep practicing!"}
          </p>
        </div>
      </div>
    </div>
  )
}
