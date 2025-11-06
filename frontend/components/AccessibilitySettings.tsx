'use client'

import { useState, useEffect } from 'react'

interface AccessibilitySettingsProps {
  onToggle?: () => void
}

export default function AccessibilitySettings({ onToggle }: AccessibilitySettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dyslexiaMode, setDyslexiaMode] = useState(false)

  useEffect(() => {
    // Check local storage for saved preference
    const saved = localStorage.getItem('dyslexia-mode')
    if (saved === 'true') {
      setDyslexiaMode(true)
      document.body.classList.add('dyslexia-friendly')
    }
  }, [])

  const toggleDyslexiaMode = () => {
    const newMode = !dyslexiaMode
    setDyslexiaMode(newMode)

    if (newMode) {
      document.body.classList.add('dyslexia-friendly')
      localStorage.setItem('dyslexia-mode', 'true')
    } else {
      document.body.classList.remove('dyslexia-friendly')
      localStorage.setItem('dyslexia-mode', 'false')
    }

    if (onToggle) onToggle()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xl font-semibold transition-colors flex items-center gap-2"
        title="Accessibility settings"
      >
        ⚙️
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Settings panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl p-6 z-50 border-4 border-blue-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Reading Settings
            </h3>

            <div className="space-y-4">
              {/* Dyslexia Mode */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-800">
                    Dyslexia-Friendly
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Extra spacing for easier reading
                  </div>
                </div>
                <button
                  onClick={toggleDyslexiaMode}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    dyslexiaMode ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      dyslexiaMode ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Info */}
              <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-xl">
                <strong>Tip:</strong> Dyslexia mode increases letter and word spacing, proven to improve reading speed and accuracy by 20%+
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
