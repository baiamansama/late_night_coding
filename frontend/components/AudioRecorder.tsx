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

function makeWsUrl(path: string) {
  // Prefer env (e.g., NEXT_PUBLIC_API_URL=https://api.example.com)
  const base = process.env.NEXT_PUBLIC_API_URL
  if (base) return base.replace(/^http/, 'ws') + path

  // Derive from current origin; swap port 3000 -> 8000 for local dev
  const { protocol, hostname, port } = window.location
  const wsScheme = protocol === 'https:' ? 'wss:' : 'ws:'
  const finalPort = port === '3000' ? '8000' : port
  return `${wsScheme}//${hostname}${finalPort ? ':' + finalPort : ''}${path}`
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

  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const currentWordIndexRef = useRef(0)

  // Stop on unmount / tab close
  useEffect(() => {
    const ok =
      typeof window !== 'undefined' &&
      'AudioWorkletNode' in window &&
      navigator.mediaDevices?.getUserMedia

    if (!ok) {
      setIsSupported(false)
      setError('Your browser does not support low-latency audio recording.')
    }

    const cleanup = () => stopRecording()
    window.addEventListener('pagehide', cleanup)
    window.addEventListener('beforeunload', cleanup)
    return () => {
      window.removeEventListener('pagehide', cleanup)
      window.removeEventListener('beforeunload', cleanup)
      stopRecording()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startRecording() {
    try {
      setError(null)
      currentWordIndexRef.current = 0

      // 1) Mic
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      streamRef.current = stream

      // 2) WS
      const ws = new WebSocket(makeWsUrl('/ws/recognize'))
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'start', expectedWords }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'ready') {
            // ready to receive PCM16 frames
          } else if (data.type === 'word_recognized') {
            onTranscript(data.word, data.index)
            currentWordIndexRef.current = data.index + 1
            if ('vibrate' in navigator) navigator.vibrate(40)
            if (data.index >= expectedWords.length - 1) {
              onComplete()
              stopRecording()
            }
          } else if (data.type === 'error') {
            setError(data.message || 'Recognition error')
          }
        } catch {
          // ignore non-JSON (shouldn't happen here)
        }
      }

      ws.onerror = () => {
        setError('WebSocket error. Is the backend running?')
      }

      ws.onclose = () => {
        setIsRecording(false)
      }

      // 3) AudioContext + Worklet
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = ctx
      await ctx.audioWorklet.addModule('/worklets/pcm16-encoder.js')

      // Force resume (iOS/Safari)
      if (ctx.state === 'suspended') await ctx.resume()

      const src = ctx.createMediaStreamSource(stream)

      // Request zero outputs; pass a small frame size to keep messages tight
      const node = new AudioWorkletNode(ctx, 'pcm16-encoder', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        processorOptions: { frameSamples: 320 } // ~20ms @16k
      })
      workletNodeRef.current = node

      // Send PCM16 frames; drop if WS buffer is getting large to avoid latency build-up
      node.port.onmessage = (e) => {
        const buf = e.data as ArrayBuffer
        const sock = wsRef.current
        if (!sock || sock.readyState !== WebSocket.OPEN) return
        if (sock.bufferedAmount > 512 * 1024) return // drop when >512KB queued
        sock.send(buf)
      }

      src.connect(node)
      setIsRecording(true)
    } catch (err) {
      console.error(err)
      setError('Could not access microphone. Please grant permission.')
      setIsRecording(false)
    }
  }

  function stopRecording() {
    try {
      workletNodeRef.current?.disconnect()
      workletNodeRef.current = null
      audioContextRef.current?.close()
      audioContextRef.current = null
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null

      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stop' }))
        ws.close()
      }
      wsRef.current = null
    } finally {
      setIsRecording(false)
    }
  }

  function toggleRecording() {
    if (isRecording) stopRecording()
    else startRecording()
  }

  if (!isSupported) {
    return (
      <div className="text-center p-6 rounded-3xl bg-red-100">
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
