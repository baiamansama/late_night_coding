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
    const el = wordRefs.current[currentWordIndex]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentWordIndex])

  const getWordClassName = (word: Word, index: number) => {
    const base = 'inline-block px-2 py-1 mx-1 my-1 rounded-lg transition-all duration-300 text-3xl font-semibold'
    if (word.status === 'correct') return `${base} text-green-600 bg-green-50 word-correct`
    if (word.status === 'error')   return `${base} text-red-600 bg-red-50 word-error`
    if (index === currentWordIndex) return `${base} text-purple-700 bg-purple-100 ring-4 ring-purple-400 scale-110`
    return `${base} text-gray-500 word-pending`
  }

  return (
    <div
      ref={containerRef}
      className="bg-warm-bg rounded-3xl shadow-xl p-12 max-h-[500px] overflow-y-auto border-4 border-calm-blue scroll-pt-40"
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
