// Dedicated recording metronome. The MIDI recorder owns the master start timestamp.
// Schedule Web Audio clicks ahead of time, rather than firing them on UI repaint.
let context = null
let interval = null
let nextBeat = 0
let running = false
function click(time, accent) {
  const oscillator = context.createOscillator()
  const envelope = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(accent ? 1200 : 850, time)
  envelope.gain.setValueAtTime(0.0001, time)
  envelope.gain.exponentialRampToValueAtTime(accent ? 0.14 : 0.085, time + 0.004)
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.052)
  oscillator.connect(envelope)
  envelope.connect(context.destination)
  oscillator.start(time)
  oscillator.stop(time + 0.06)
}
export async function prepareCaptureMetronome() {
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return false
  context ||= new Ctor()
  await context.resume()
  return true
}
export async function startCaptureMetronome(originMs, bpm, beatsPerBar = 4) {
  stopCaptureMetronome()
  if (!(await prepareCaptureMetronome())) return false
  running = true
  nextBeat = 0
  const secondsPerBeat = 60 / bpm
  // Correlate performance clock to the actual audio clock on every scheduling pass.
  function schedule() {
    if (!running || !context) return
    const nowPerf = performance.now()
    const nowAudio = context.currentTime
    while (true) {
      const targetPerf = originMs + nextBeat * secondsPerBeat * 1000
      const aheadSeconds = (targetPerf - nowPerf) / 1000
      if (aheadSeconds > 0.15) break
      if (aheadSeconds > -0.06) click(nowAudio + Math.max(0.002, aheadSeconds), nextBeat % beatsPerBar === 0)
      nextBeat++
    }
  }
  schedule()
  interval = window.setInterval(schedule, 24)
  return true
}
export function stopCaptureMetronome() {
  running = false
  if (interval !== null) window.clearInterval(interval)
  interval = null
}
