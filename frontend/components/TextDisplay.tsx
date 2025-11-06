'use client'

import { useEffect, useRef } from 'react'

interface Word {
  text: string
  status: 'pending' | 'correct' | 'error'
  spokenAs?: string
}

interface TextDisplayProps {
  words: Word[]
  currentWordIndex: number
}

export default function TextDisplay({ words, currentWordIndex }: TextDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    // Scroll to current word
    if (currentWordIndex < wordRefs.current.length && wordRefs.current[currentWordIndex]) {
      wordRefs.current[currentWordIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [currentWordIndex])

  const getWordClassName = (word: Word, index: number) => {
    const baseClasses = 'inline-block px-2 py-1 mx-1 my-1 rounded-lg transition-all duration-300 text-3xl font-semibold'

    if (word.status === 'correct') {
      return `${baseClasses} text-green-600 bg-green-50 word-correct`
    } else if (word.status === 'error') {
      return `${baseClasses} text-red-600 bg-red-50 word-error`
    } else if (index === currentWordIndex) {
      return `${baseClasses} text-purple-700 bg-purple-100 ring-4 ring-purple-400 scale-110`
    } else {
      return `${baseClasses} text-gray-500 word-pending`
    }
  }

  return (
    <div
      ref={containerRef}
      className="bg-warm-bg rounded-3xl shadow-xl p-12 max-h-[500px] overflow-y-auto border-4 border-calm-blue"
    >
      <div className="reading-text leading-loose font-lexend">
        {words.map((word, index) => (
          <span key={index}>
            <span
              ref={(el) => { wordRefs.current[index] = el }}
              className={getWordClassName(word, index)}
            >
              {word.text}
            </span>
            {/* Show what was actually spoken if different */}
            {word.status === 'error' && word.spokenAs && (
              <span className="text-sm text-gray-500 italic ml-1">
                (you said: {word.spokenAs})
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
