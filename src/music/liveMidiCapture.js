import { reactive } from 'vue'

// Local-only capture. CH receives a copy of raw events over BroadcastChannel;
// notation retains the actual MIDI pitches and elapsed timing independently.
export const liveCapture = reactive({
  recording: false,
  startedAt: 0,
  bpm: 72,
  events: [],
  notes: [],
  held: new Map(),
  durationMs: 0,
  take: 0
})

export function startLiveCapture(bpm = 72) {
  liveCapture.recording = true
  liveCapture.bpm = Number(bpm) || 72
  liveCapture.startedAt = performance.now()
  liveCapture.events = []
  liveCapture.notes = []
  liveCapture.held = new Map()
  liveCapture.durationMs = 0
  liveCapture.take += 1
}

export function stopLiveCapture() {
  if (!liveCapture.recording) return
  const elapsed = performance.now() - liveCapture.startedAt
  for (const note of liveCapture.held.values()) note.durationMs = Math.max(1, elapsed - note.atMs)
  liveCapture.held = new Map()
  liveCapture.durationMs = elapsed
  liveCapture.recording = false
}

export function ingestLiveMidi(bytes, timestamp = performance.now()) {
  if (!liveCapture.recording || !Array.isArray(bytes)) return
  const [status = 0, pitch = 0, velocity = 0] = bytes
  const kind = status & 0xf0
  const channel = status & 0x0f
  const atMs = Math.max(0, timestamp - liveCapture.startedAt)
  liveCapture.events.push({ atMs, bytes: [...bytes] })
  liveCapture.durationMs = Math.max(liveCapture.durationMs, atMs)
  const key = `${channel}:${pitch}`
  if (kind === 0x90 && velocity > 0) {
    // If a keyboard repeats the note without an off, close the prior note.
    const previous = liveCapture.held.get(key)
    if (previous) previous.durationMs = Math.max(1, atMs - previous.atMs)
    const note = { midi: pitch, channel, velocity, atMs, durationMs: null }
    liveCapture.notes.push(note)
    liveCapture.held.set(key, note)
  } else if (kind === 0x80 || (kind === 0x90 && velocity === 0)) {
    const note = liveCapture.held.get(key)
    if (note) note.durationMs = Math.max(1, atMs - note.atMs)
    liveCapture.held.delete(key)
  } else if (kind === 0xb0 && (pitch === 120 || pitch === 123)) {
    for (const [k, note] of liveCapture.held) {
      if (note.channel === channel) {
        note.durationMs = Math.max(1, atMs - note.atMs)
        liveCapture.held.delete(k)
      }
    }
  }
}

export function exportLiveCapture() {
  const payload = {
    format: 'd3srt-raw-midi-take', version: 1,
    bpm: liveCapture.bpm, durationMs: liveCapture.durationMs,
    events: liveCapture.events.map(e => ({ atMs: e.atMs, bytes: [...e.bytes] })),
    notes: liveCapture.notes.map(n => ({ ...n }))
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `d3srt-midi-take-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
