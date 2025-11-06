'use client'

import { useState, useRef, useEffect } from 'react'

interface AudioRecorderProps {
  onTranscript: (word: string, index: number) => void
  onComplete: () => void
  expectedWords: string[]
  isRecording: boolean
  setIsRecording: (recording: boolean) => void
}

export default function AudioRecorder({
  onTranscript,
  onComplete,
  expectedWords,
  isRecording,
  setIsRecording
}: AudioRecorderProps) {
  const [isSupported, setIsSupported] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const currentWordIndexRef = useRef(0)

  useEffect(() => {
    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false)
      setError('Your browser does not support audio recording')
    }

    return () => {
      stopRecording()
    }
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
      currentWordIndexRef.current = 0

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      })

      // Create audio context (for future audio processing)
      audioContextRef.current = new AudioContext({ sampleRate: 16000 })

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder

      // Connect to WebSocket (backend will be on port 8000)
      const ws = new WebSocket('ws://localhost:8000/ws/recognize')
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        // Send expected words to backend
        ws.send(JSON.stringify({
          type: 'start',
          expectedWords: expectedWords
        }))
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.type === 'word_recognized') {
          // Word was recognized
          console.log('Word recognized:', data.word, 'at index:', data.index)
          onTranscript(data.word, data.index)
          currentWordIndexRef.current = data.index + 1

          // Vibrate for success (Android only)
          if ('vibrate' in navigator) {
            navigator.vibrate(50)
          }

          // Check if reading is complete
          if (data.index >= expectedWords.length - 1) {
            onComplete()
            stopRecording()
          }
        } else if (data.type === 'error') {
          console.error('Recognition error:', data.message)
          setError(data.message)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('Connection error. Please check if the backend is running.')
      }

      ws.onclose = () => {
        console.log('WebSocket closed')
      }

      // Send audio chunks to backend
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          event.data.arrayBuffer().then(buffer => {
            ws.send(buffer)
          })
        }
      }

      mediaRecorder.start(250) // Send chunks every 250ms for real-time processing
      setIsRecording(true)

    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Could not access microphone. Please grant permission.')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }))
      wsRef.current.close()
    }

    setIsRecording(false)
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  if (!isSupported) {
    return (
      <div className="text-center p-6 bg-red-100 rounded-3xl">
        <p className="text-red-700 text-xl">{error}</p>
      </div>
    )
  }

  return (
    <div className="text-center space-y-4">
      <button
        onClick={toggleRecording}
        className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl transition-all duration-300 ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-300 animate-pulse'
            : 'bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-300 hover:scale-110'
        }`}
      >
        {isRecording ? '⏸️' : '🎤'}
      </button>

      <p className="text-2xl font-semibold text-gray-700">
        {isRecording ? 'Reading... (Click to pause)' : 'Click the microphone to start reading!'}
      </p>

      {error && (
        <div className="p-4 bg-yellow-100 rounded-2xl">
          <p className="text-yellow-800 text-lg">{error}</p>
        </div>
      )}
    </div>
  )
}
