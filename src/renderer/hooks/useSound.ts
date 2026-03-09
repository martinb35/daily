// Synthesized UI sounds using Web Audio API — no audio files needed
let audioCtx: AudioContext | null = null

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  rampDown = true
): void {
  const ctx = getContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.value = volume
  if (rampDown) {
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  }
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

function playChime(frequencies: number[], interval: number, duration: number): void {
  frequencies.forEach((freq, i) => {
    setTimeout(() => playTone(freq, duration), i * interval)
  })
}

const sounds = {
  // Satisfying two-note ascending chime for completing a task
  complete: (): void => {
    playChime([523, 784], 100, 0.3) // C5 → G5
  },

  // Quick bright pop for triage decisions (Do, Delegate)
  triage: (): void => {
    playTone(880, 0.12, 'sine', 0.1)
  },

  // Soft descending tone for deferring/snoozing
  defer: (): void => {
    playChime([440, 330], 80, 0.2) // A4 → E4
  },

  // Light click for copy-to-clipboard
  copy: (): void => {
    playTone(1200, 0.06, 'sine', 0.08)
  },

  // Subtle reverse swoosh for moving back to inbox
  moveBack: (): void => {
    playChime([330, 440], 60, 0.15) // E4 → A4
  },

  // Low soft tone for delete
  delete: (): void => {
    playTone(220, 0.15, 'triangle', 0.1)
  },

  // Quick add confirmation
  add: (): void => {
    playTone(660, 0.1, 'sine', 0.08)
  }
}

export type SoundName = keyof typeof sounds

export function useSound(): (name: SoundName) => void {
  return (name: SoundName): void => {
    try {
      sounds[name]()
    } catch {
      // Audio may fail in some environments — fail silently
    }
  }
}
