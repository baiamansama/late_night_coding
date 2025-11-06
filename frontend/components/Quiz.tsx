'use client'

import { useState } from 'react'
import { QUIZ_MESSAGES, getRandomMessage } from '@/lib/encouragement'
import { Check, X, Brain, Award } from 'lucide-react'

interface QuizQuestion {
  question: string
  options: string[]
  correct_answer: number
  explanation?: string
}

interface QuizProps {
  questions: QuizQuestion[]
  onComplete: (score: number) => void
}

export default function Quiz({ questions, onComplete }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>(
    new Array(questions.length).fill(false)
  )

  const handleAnswerSelect = (index: number) => {
    if (showFeedback) return // Don't allow changing answer after submission

    setSelectedAnswer(index)
  }

  const handleSubmit = () => {
    if (selectedAnswer === null) return

    const isCorrect = selectedAnswer === questions[currentQuestion].correct_answer

    if (isCorrect) {
      setScore(score + 1)
      // Vibrate for success
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 100])
      }
    }

    setShowFeedback(true)

    // Mark question as answered
    const newAnswered = [...answeredQuestions]
    newAnswered[currentQuestion] = true
    setAnsweredQuestions(newAnswered)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
    } else {
      // Quiz complete
      onComplete(score)
    }
  }

  if (questions.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-3xl shadow-lg">
        <p className="text-2xl text-gray-600">Loading questions...</p>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const isCorrect = selectedAnswer === currentQ.correct_answer
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xl font-semibold text-gray-700">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-xl font-semibold text-purple-600">
            Score: {score}/{questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-400 to-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">
          {currentQ.question}
        </h2>

        <div className="space-y-4">
          {currentQ.options.map((option, index) => {
            const isSelected = selectedAnswer === index
            const isCorrectAnswer = index === currentQ.correct_answer

            let buttonClass = 'w-full text-left p-6 rounded-2xl text-xl font-semibold transition-all duration-300 border-4 '

            if (!showFeedback) {
              buttonClass += isSelected
                ? 'border-purple-500 bg-purple-50 text-purple-700 scale-105 shadow-lg'
                : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50 hover:scale-102'
            } else {
              if (isCorrectAnswer) {
                buttonClass += 'border-green-500 bg-green-50 text-green-700'
              } else if (isSelected && !isCorrect) {
                buttonClass += 'border-red-500 bg-red-50 text-red-700'
              } else {
                buttonClass += 'border-gray-200 bg-gray-50 opacity-50'
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showFeedback}
                className={buttonClass}
              >
                <div className="flex items-center">
                  <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-4 text-lg font-bold border-2">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                  {showFeedback && isCorrectAnswer && (
                    <Check className="ml-auto w-8 h-8 text-green-600" />
                  )}
                  {showFeedback && isSelected && !isCorrect && (
                    <X className="ml-auto w-8 h-8 text-red-600" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className={`mt-8 p-6 rounded-2xl ${
            isCorrect ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            <div className={`flex items-center gap-3 text-2xl font-bold mb-2 ${
              isCorrect ? 'text-green-700' : 'text-blue-700'
            }`}>
              {isCorrect ? (
                <>
                  <Brain className="w-6 h-6" />
                  <span>{getRandomMessage(QUIZ_MESSAGES.correct)}</span>
                </>
              ) : (
                <>
                  <Brain className="w-6 h-6" />
                  <span>Not quite! But you're learning!</span>
                </>
              )}
            </div>
            {currentQ.explanation && (
              <p className="text-xl text-gray-700">
                {currentQ.explanation}
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 text-center">
          {!showFeedback ? (
            <button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              className={`px-12 py-4 rounded-full text-2xl font-bold transition-all ${
                selectedAnswer !== null
                  ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-12 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-2xl font-bold shadow-lg hover:scale-105 transition-all"
            >
              {currentQuestion < questions.length - 1 ? 'Next Question →' : 'See Results'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
