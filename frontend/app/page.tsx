'use client'

import Link from 'next/link'
import { BookOpen, Sparkles, Trophy } from 'lucide-react'

const readingTexts = [
  {
    id: 'adventure-forest',
    title: 'The Forest Adventure',
    description: 'Join Max on an exciting journey through the magical forest',
    difficulty: 'Easy',
    wordCount: 150,
  },
  {
    id: 'space-explorer',
    title: 'Space Explorer',
    description: 'Discover the mysteries of the solar system',
    difficulty: 'Medium',
    wordCount: 200,
  },
  {
    id: 'ocean-mystery',
    title: 'The Ocean Mystery',
    description: 'Dive deep into an underwater adventure',
    difficulty: 'Medium',
    wordCount: 180,
  },
]

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-4">
          Reading Adventure
        </h1>
        <p className="text-2xl text-gray-600">
          Choose a story and start reading aloud!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {readingTexts.map((text) => (
          <Link
            key={text.id}
            href={`/reading/${text.id}`}
            className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 hover:scale-105 border-4 border-transparent hover:border-purple-400"
          >
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white mb-4">
                <BookOpen className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {text.title}
              </h2>
              <p className="text-xl text-gray-600 mb-4">
                {text.description}
              </p>
            </div>
            <div className="flex items-center justify-between text-lg">
              <span className={`px-4 py-2 rounded-full font-semibold ${
                text.difficulty === 'Easy'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {text.difficulty}
              </span>
              <span className="text-gray-500">
                {text.wordCount} words
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-16 text-center">
        <div className="bg-white rounded-3xl shadow-lg p-8 inline-block">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            How to use:
          </h3>
          <ol className="text-left text-xl text-gray-600 space-y-3">
            <li className="flex items-start">
              <span className="text-purple-600 font-bold mr-3">1.</span>
              <span>Choose a story you like</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 font-bold mr-3">2.</span>
              <span>Click the microphone button and read aloud</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 font-bold mr-3">3.</span>
              <span>Watch your words turn green as you read!</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 font-bold mr-3">4.</span>
              <span>Answer fun questions about the story</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
