// AudioWorkletProcessor that resamples to 16kHz and emits **little-endian** PCM16 frames.
// Uses linear interpolation (works on 44.1k or 48k input); batches ~20ms frames by default.

class PCM16Encoder extends AudioWorkletProcessor {
  constructor(options) {
    super()
    const opts = (options && options.processorOptions) || {}
    this.frameSamples = Number(opts.frameSamples) || 320 // ~20ms @16k
    this.step = sampleRate / 16000
    this.phase = 0
    this.queue = [] // int16 values waiting to flush
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || input.length === 0) return true
    const mono = input[0] || new Float32Array(0)

    // Linear resampler to 16k
    let p = this.phase
    const step = this.step
    const out = []

    for (; p < mono.length; p += step) {
      const i = p | 0
      const frac = p - i
      const s0 = mono[i] || 0
      const s1 = mono[i + 1] ?? s0
      const s = s0 + (s1 - s0) * frac // interpolate
      const clamped = Math.max(-1, Math.min(1, s))
      const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
      out.push(int16)
    }
    this.phase = p - mono.length

    if (out.length) this.queue.push(...out)

    // Flush in fixed-size frames for stable latency/throughput
    while (this.queue.length >= this.frameSamples) {
      const chunk = this.queue.splice(0, this.frameSamples)
      // Pack little-endian explicitly (portable across architectures)
      const buf = new ArrayBuffer(chunk.length * 2)
      const view = new DataView(buf)
      for (let i = 0; i < chunk.length; i++) view.setInt16(i * 2, chunk[i], true) // LE
      this.port.postMessage(buf, [buf]) // zero-copy
    }

    return true
  }
}

registerProcessor('pcm16-encoder', PCM16Encoder)
