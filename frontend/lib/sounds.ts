/**
 * Sound effects for educational feedback
 * Using Web Audio API to generate pleasant tones
 */

class SoundEffects {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new AudioContext()
      } catch (e) {
        console.warn('Web Audio API not supported')
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Play a success sound (pleasant chime)
   */
  playSuccess() {
    if (!this.enabled || !this.audioContext) return

    const ctx = this.audioContext
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Pleasant major chord notes
    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
    oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1) // E5

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
  }

  /**
   * Play a word recognition sound (soft beep)
   */
  playWordRecognized() {
    if (!this.enabled || !this.audioContext) return

    const ctx = this.audioContext
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(800, ctx.currentTime)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  }

  /**
   * Play a milestone achievement sound
   */
  playMilestone() {
    if (!this.enabled || !this.audioContext) return

    const ctx = this.audioContext

    // Play ascending notes
    const notes = [261.63, 329.63, 392.00, 523.25] // C4, E4, G4, C5

    notes.forEach((freq, index) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1)
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime + index * 0.1)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.1 + 0.2)

      oscillator.start(ctx.currentTime + index * 0.1)
      oscillator.stop(ctx.currentTime + index * 0.1 + 0.2)
    })
  }

  /**
   * Play a celebration fanfare
   */
  playCelebration() {
    if (!this.enabled || !this.audioContext) return

    const ctx = this.audioContext

    // Play a triumphant sequence
    const sequence = [
      { freq: 523.25, time: 0 },     // C5
      { freq: 659.25, time: 0.15 },  // E5
      { freq: 783.99, time: 0.3 },   // G5
      { freq: 1046.50, time: 0.45 }, // C6
    ]

    sequence.forEach(({ freq, time }) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + time)
      oscillator.type = 'triangle'

      gainNode.gain.setValueAtTime(0.4, ctx.currentTime + time)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + 0.3)

      oscillator.start(ctx.currentTime + time)
      oscillator.stop(ctx.currentTime + time + 0.3)
    })
  }

  /**
   * Play a gentle error sound (not punitive)
   */
  playGentle() {
    if (!this.enabled || !this.audioContext) return

    const ctx = this.audioContext
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(300, ctx.currentTime)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.2)
  }

  /**
   * Play button click sound
   */
  playClick() {
    if (!this.enabled || !this.audioContext) return

    const ctx = this.audioContext
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(600, ctx.currentTime)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.05)
  }
}

// Create singleton instance
let soundEffects: SoundEffects | null = null

export function getSoundEffects(): SoundEffects {
  if (!soundEffects) {
    soundEffects = new SoundEffects()
  }
  return soundEffects
}

export default SoundEffects
