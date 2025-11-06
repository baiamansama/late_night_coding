'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Quiz from '@/components/Quiz'

// Sample reading texts (same as reading page)
const readingTexts: { [key: string]: string } = {
  'adventure-forest': 'Once upon a time there was a young explorer named Max. Max loved to discover new things in the forest. One sunny morning Max decided to venture deeper into the woods than ever before. The tall trees swayed gently in the breeze. Birds sang beautiful melodies from the branches above. Max found a hidden path covered with colorful flowers. At the end of the path was a sparkling stream. The water was so clear that Max could see fish swimming below. It was the most magical place Max had ever seen. Max knew this would be a day to remember forever.',

  'space-explorer': 'Sarah had always dreamed of becoming an astronaut. She studied the stars and planets every night. One day Sarah received an invitation to visit a space station. She put on her special space suit and boarded the rocket ship. The countdown began and the engines roared to life. The rocket shot up through the clouds and into the darkness of space. Through the window Sarah could see Earth getting smaller and smaller. The moon looked enormous and beautiful. Sarah floated weightlessly inside the space station. She conducted experiments and took photographs of distant galaxies. It was an adventure Sarah would never forget.',

  'ocean-mystery': 'Deep beneath the ocean waves lived a curious dolphin named Luna. Luna loved exploring the coral reefs and making new friends. One day Luna discovered a mysterious underwater cave. The entrance was covered with glowing seaweed that lit up the dark water. Luna swam carefully into the cave and found ancient treasures scattered on the sandy floor. There were old coins golden necklaces and beautiful shells. Luna realized this must be a sunken pirate ship. Schools of colorful fish swam through the wreckage. Luna decided to share this discovery with all her ocean friends. Together they turned the cave into a magical playground.'
}

interface QuizQuestion {
  question: string
  options: string[]
  correct_answer: number
  explanation?: string
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params?.sessionId as string

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Extract textId from sessionId (format: session-textId-timestamp)
    // For demo, we'll use a simplified approach
    const loadQuiz = async () => {
      try {
        // In a real app, we would fetch the text based on the session
        // For now, let's use the first text as a demo
        const textId = 'adventure-forest' // You'd extract this from session data
        const text = readingTexts[textId]

        // Call backend API to generate quiz
        const response = await fetch('http://localhost:8000/api/generate-quiz', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            session_id: sessionId
          })
        })

        if (!response.ok) {
          throw new Error('Failed to generate quiz')
        }

        const data = await response.json()
        setQuestions(data.questions)
        setLoading(false)

      } catch (err) {
        console.error('Error loading quiz:', err)
        setError('Could not load quiz. Using sample questions instead.')

        // Fallback to sample questions
        setQuestions([
          {
            question: "Who is the main character in the story?",
            options: ["Luna", "Max", "Sarah", "Jack"],
            correct_answer: 1,
            explanation: "Max is the young explorer who goes into the forest."
          },
          {
            question: "Where did Max find the magical place?",
            options: ["In a cave", "At the end of a hidden path", "Near his house", "In the clouds"],
            correct_answer: 1,
            explanation: "Max found a hidden path covered with colorful flowers that led to the sparkling stream."
          },
          {
            question: "What did Max see in the water?",
            options: ["Dolphins", "Fish", "Boats", "Treasure"],
            correct_answer: 1,
            explanation: "The water was so clear that Max could see fish swimming below."
          },
          {
            question: "How did Max feel about his discovery?",
            options: ["Scared", "Bored", "It was magical", "Tired"],
            correct_answer: 2,
            explanation: "Max thought it was the most magical place he had ever seen."
          },
          {
            question: "What time of day did Max go exploring?",
            options: ["Night", "Evening", "Morning", "Afternoon"],
            correct_answer: 2,
            explanation: "The story says it was 'one sunny morning' when Max decided to venture into the woods."
          }
        ])
        setLoading(false)
      }
    }

    loadQuiz()
  }, [sessionId])

  const handleQuizComplete = (score: number) => {
    // Navigate to results page
    router.push(`/results/${sessionId}?score=${score}&total=${questions.length}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🧠</div>
          <div className="text-4xl font-bold text-gray-700">
            Creating your quiz...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-4">
          Comprehension Quiz
        </h1>
        <p className="text-2xl text-gray-600">
          Let's see how well you understood the story!
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-100 rounded-2xl text-yellow-800 text-center">
          {error}
        </div>
      )}

      <Quiz questions={questions} onComplete={handleQuizComplete} />
    </div>
  )
}
