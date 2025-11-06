'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Pause } from 'lucide-react'

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
  const recorderRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
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
      streamRef.current = stream

      // Connect to WebSocket (backend will be on port 8000)
      const ws = new WebSocket('ws://localhost:8000/ws/recognize')
      wsRef.current = ws

      ws.onopen = () => {
        console.log('✅ WebSocket connected')
        console.log('📤 Sending expected words:', expectedWords.slice(0, 5), '...')
        // Send expected words to backend
        ws.send(JSON.stringify({
          type: 'start',
          expectedWords: expectedWords
        }))
      }

      ws.onmessage = (event) => {
        console.log('📨 Message from backend:', event.data)
        const data = JSON.parse(event.data)

        if (data.type === 'ready') {
          console.log('✅ Backend ready to receive audio')
        } else if (data.type === 'word_recognized') {
          // Word was recognized
          console.log('🎯 Word recognized:', data.word, 'at index:', data.index, 'confidence:', data.confidence)
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
          console.error('❌ Recognition error:', data.message)
          setError(data.message)
        } else {
          console.log('❓ Unknown message type:', data.type, data)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('Connection error. Please check if the backend is running.')
      }

      ws.onclose = () => {
        console.log('WebSocket closed')
      }

      // Dynamically import RecordRTC (client-side only)
      const RecordRTC = (await import('recordrtc')).default
      const { StereoAudioRecorder } = await import('recordrtc')

      // Create RecordRTC instance with WAV format
      let chunkCount = 0
      const recorder = RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: StereoAudioRecorder,
        numberOfAudioChannels: 1, // mono
        desiredSampRate: 16000, // 16kHz for Azure
        timeSlice: 250, // Send smaller chunks every 250ms for faster feedback
        ondataavailable: (blob: Blob) => {
          if (ws.readyState === WebSocket.OPEN) {
            chunkCount++
            console.log(`🎤 Sending WAV chunk #${chunkCount}, size: ${blob.size} bytes`)
            // Convert blob to ArrayBuffer and send
            blob.arrayBuffer().then(buffer => {
              ws.send(buffer)
            })
          }
        }
      })

      recorderRef.current = recorder
      recorder.startRecording()
      console.log('🎙️ RecordRTC started, sending WAV chunks every 250ms')
      setIsRecording(true)

    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Could not access microphone. Please grant permission.')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording()
      recorderRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
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
        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-300 animate-pulse text-white'
            : 'bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-300 hover:scale-110 text-white'
        }`}
      >
        {isRecording ? <Pause className="w-16 h-16" /> : <Mic className="w-16 h-16" />}
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
