'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Volume2, VolumeX, PartyPopper } from 'lucide-react'
import AudioRecorder from '@/components/AudioRecorder'
import TextDisplay from '@/components/TextDisplay'
import EncouragementFeedback from '@/components/EncouragementFeedback'
import Toast, { useToast } from '@/components/Toast'
import AccessibilitySettings from '@/components/AccessibilitySettings'
import {
  getMilestoneMessage,
  getStreakMessage,
  getWordMessage,
  getPowerUpMessage,
  getEasterEggMessage
} from '@/lib/encouragement'
import { getSoundEffects } from '@/lib/sounds'

// Sample reading texts
const readingTexts: { [key: string]: string } = {
  'adventure-forest': 'Once upon a time there was a young explorer named Max. Max loved to discover new things in the forest. One sunny morning Max decided to venture deeper into the woods than ever before. The tall trees swayed gently in the breeze. Birds sang beautiful melodies from the branches above. Max found a hidden path covered with colorful flowers. At the end of the path was a sparkling stream. The water was so clear that Max could see fish swimming below. It was the most magical place Max had ever seen. Max knew this would be a day to remember forever.',

  'space-explorer': 'Sarah had always dreamed of becoming an astronaut. She studied the stars and planets every night. One day Sarah received an invitation to visit a space station. She put on her special space suit and boarded the rocket ship. The countdown began and the engines roared to life. The rocket shot up through the clouds and into the darkness of space. Through the window Sarah could see Earth getting smaller and smaller. The moon looked enormous and beautiful. Sarah floated weightlessly inside the space station. She conducted experiments and took photographs of distant galaxies. It was an adventure Sarah would never forget.',

  'ocean-mystery': 'Deep beneath the ocean waves lived a curious dolphin named Luna. Luna loved exploring the coral reefs and making new friends. One day Luna discovered a mysterious underwater cave. The entrance was covered with glowing seaweed that lit up the dark water. Luna swam carefully into the cave and found ancient treasures scattered on the sandy floor. There were old coins golden necklaces and beautiful shells. Luna realized this must be a sunken pirate ship. Schools of colorful fish swam through the wreckage. Luna decided to share this discovery with all her ocean friends. Together they turned the cave into a magical playground.'
}

interface Word {
  text: string
  status: 'pending' | 'correct' | 'error'
  spokenAs?: string
}

export default function ReadingPage() {
  const params = useParams()
  const router = useRouter()
  const textId = params?.textId as string

  const [words, setWords] = useState<Word[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [correctStreak, setCorrectStreak] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const { toasts, addToast, removeToast, showSuccess, showCelebration, showEncouragement } = useToast()
  const soundEffects = useRef(getSoundEffects())
  const lastProgressRef = useRef(0)

  useEffect(() => {
    // Initialize words from the selected text
    const text = readingTexts[textId]
    if (!text) {
      router.push('/')
      return
    }

    const wordList = text.split(' ').map(word => ({
      text: word,
      status: 'pending' as const,
    }))
    setWords(wordList)

    // Generate session ID
    setSessionId(`session-${Date.now()}`)
  }, [textId, router])

  const handleTranscript = (recognizedWord: string, index: number) => {
    setWords(prevWords => {
      const newWords = [...prevWords]
      if (index < newWords.length) {
        newWords[index] = {
          ...newWords[index],
          status: 'correct',
          spokenAs: recognizedWord
        }
      }
      return newWords
    })
    setCurrentWordIndex(index + 1)

    // Play success sound
    if (soundEnabled) {
      soundEffects.current.playWordRecognized()
    }

    // Update streak
    const newStreak = correctStreak + 1
    setCorrectStreak(newStreak)

    // Check for easter egg (5% chance - rare!)
    const easterEgg = getEasterEggMessage()
    if (easterEgg) {
      showCelebration(easterEgg, 5000)
    }

    // Check for power-up message (10% chance)
    const powerUp = getPowerUpMessage()
    if (powerUp) {
      showEncouragement(powerUp, 2500)
    }

    // Show word recognition message (every 5 words)
    const wordMsg = getWordMessage(newStreak)
    if (wordMsg && !easterEgg && !powerUp) { // Don't show if we have special messages
      showSuccess(wordMsg, 2000)
    }

    // Show streak message (priority over other messages)
    const streakMsg = getStreakMessage(newStreak)
    if (streakMsg) {
      showCelebration(streakMsg, 4000) // Longer duration for streaks
      if (soundEnabled) {
        soundEffects.current.playMilestone()
      }
    }
  }

  const handleComplete = () => {
    setIsComplete(true)
    setIsRecording(false)

    // Play celebration
    if (soundEnabled) {
      soundEffects.current.playCelebration()
    }

    // Show completion message
    showCelebration("Amazing! You finished the story!", 5000)

    // Navigate to quiz after 4 seconds
    setTimeout(() => {
      router.push(`/quiz/${sessionId}`)
    }, 4000)
  }

  const progress = words.length > 0 ? Math.round((currentWordIndex / words.length) * 100) : 0

  // Show milestone messages
  useEffect(() => {
    if (progress > 0 && progress !== lastProgressRef.current) {
      const milestoneMsg = getMilestoneMessage(progress)
      if (milestoneMsg) {
        if (progress === 25 || progress === 50 || progress === 75) {
          showEncouragement(milestoneMsg, 4000)
          if (soundEnabled) {
            soundEffects.current.playMilestone()
          }
        }
      }
      lastProgressRef.current = progress
    }
  }, [progress, soundEnabled, showEncouragement])

  // Enable/disable sound effects
  useEffect(() => {
    soundEffects.current.setEnabled(soundEnabled)
  }, [soundEnabled])

  if (words.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl font-bold text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Toast toasts={toasts} onRemove={removeToast} />
      <EncouragementFeedback progress={progress} isComplete={isComplete} />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-full text-xl font-semibold transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-6 py-3 rounded-full text-xl font-semibold transition-colors ${
                soundEnabled
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
              }`}
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
            <AccessibilitySettings />
          </div>
          <div className="text-3xl font-bold text-gray-700">
            Progress: {progress}%
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="h-full flex items-center justify-end pr-3">
              {progress > 5 && (
                <span className="text-white font-bold text-sm">
                  {progress}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <TextDisplay words={words} currentWordIndex={currentWordIndex} />

        <AudioRecorder
          onTranscript={handleTranscript}
          onComplete={handleComplete}
          expectedWords={words.map(w => w.text)}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
        />

        {isComplete && (
          <div className="text-center p-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-3xl text-white shadow-2xl">
            <div className="flex justify-center mb-4">
              <PartyPopper className="w-16 h-16" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Fantastic Job!</h2>
            <p className="text-2xl">
              Get ready for some fun questions about the story...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
