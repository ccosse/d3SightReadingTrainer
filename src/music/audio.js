let audioContext = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  if (!audioContext) audioContext = new AudioContextClass()
  return audioContext
}

export async function ensureAudioReady() {
  const context = getAudioContext()
  if (!context) return null
  if (context.state === 'suspended') await context.resume()
  return context
}

export function midiToFrequency(midi) {
  return 440 * Math.pow(2, (Number(midi) - 69) / 12)
}

function createVoice(context, midi, velocity, start) {
  const oscillator = context.createOscillator()
  const overtone = context.createOscillator()
  const gain = context.createGain()
  const overtoneGain = context.createGain()
  const filter = context.createBiquadFilter()

  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(midiToFrequency(midi), start)
  overtone.type = 'sine'
  overtone.frequency.setValueAtTime(midiToFrequency(midi) * 2, start)
  overtoneGain.gain.setValueAtTime(Math.max(0.001, velocity * 0.10), start)

  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(3200, start)
  filter.Q.setValueAtTime(0.65, start)

  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity), start + 0.018)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.72), start + 0.11)

  oscillator.connect(filter)
  overtone.connect(overtoneGain)
  overtoneGain.connect(filter)
  filter.connect(gain)
  gain.connect(context.destination)

  oscillator.start(start)
  overtone.start(start)
  return { context, oscillator, overtone, gain, sustain: Math.max(0.001, velocity * 0.72), stopped: false }
}

export async function startMidi(midi, velocity = 0.14, when = 0) {
  const context = await ensureAudioReady()
  if (!context) return null
  const start = context.currentTime + Math.max(0, when)
  return createVoice(context, Number(midi), velocity, start)
}

export function stopMidiVoice(voice, releaseSeconds = 0.12, when = 0) {
  if (!voice || voice.stopped) return
  voice.stopped = true
  const now = voice.context.currentTime + Math.max(0, when)
  const release = Math.max(0.035, releaseSeconds)
  if (typeof voice.gain.gain.cancelAndHoldAtTime === 'function') voice.gain.gain.cancelAndHoldAtTime(now)
  else {
    voice.gain.gain.cancelScheduledValues(now)
    voice.gain.gain.setValueAtTime(voice.sustain, now)
  }
  voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + release)
  voice.oscillator.stop(now + release + 0.025)
  voice.overtone.stop(now + release + 0.025)
}

export async function startChord(midis, velocity = 0.12, when = 0) {
  const unique = [...new Set((midis || []).map(Number).filter(Number.isFinite))]
  return Promise.all(unique.map((midi) => startMidi(midi, velocity, when)))
}

export function stopChordVoices(voices, releaseSeconds = 0.12, when = 0) {
  ;(voices || []).forEach((voice) => stopMidiVoice(voice, releaseSeconds, when))
}

export async function playMidi(midi, durationSeconds = 0.5, velocity = 0.14, when = 0) {
  const voice = await startMidi(midi, velocity, when)
  if (!voice) return
  const held = Math.max(0.10, Number(durationSeconds) || 0.5)
  const release = Math.min(0.18, Math.max(0.06, held * 0.18))
  stopMidiVoice(voice, release, Math.max(0, when) + held)
}

export async function playChord(midis, durationSeconds = 0.5, velocity = 0.12, when = 0) {
  const unique = [...new Set((midis || []).map(Number).filter(Number.isFinite))]
  await Promise.all(unique.map((midi) => playMidi(midi, durationSeconds, velocity, when)))
}
