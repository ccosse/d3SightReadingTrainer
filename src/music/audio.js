let audioContext = null
let masterBus = null
let currentEngine = 'electric-piano'
let currentProgram = 4
let sustainEnabled = false

let webAudioFontPlayer = null
const soundFontPresets = new Map()
const scriptLoads = new Map()

let midiAccess = null
let midiOutputId = ''
let midiChannel = 0
let lastMidiProgram = null

const WEB_AUDIO_FONT_URL = 'https://surikov.github.io/webaudiofont/npm/dist/WebAudioFontPlayer.js'

export const AUDIO_ENGINE_OPTIONS = [
  { label: 'Electric piano · internal', value: 'electric-piano' },
  { label: 'SoundFont instrument', value: 'soundfont' },
  { label: 'Basic synth · offline', value: 'basic-synth' },
  { label: 'Web MIDI output', value: 'web-midi' }
]

const GM_NAMES = [
  'Acoustic Grand Piano', 'Bright Acoustic Piano', 'Electric Grand Piano', 'Honky-tonk Piano',
  'Electric Piano 1', 'Electric Piano 2', 'Harpsichord', 'Clavinet',
  'Celesta', 'Glockenspiel', 'Music Box', 'Vibraphone', 'Marimba', 'Xylophone', 'Tubular Bells', 'Dulcimer',
  'Drawbar Organ', 'Percussive Organ', 'Rock Organ', 'Church Organ', 'Reed Organ', 'Accordion', 'Harmonica', 'Tango Accordion',
  'Acoustic Guitar (nylon)', 'Acoustic Guitar (steel)', 'Electric Guitar (jazz)', 'Electric Guitar (clean)',
  'Electric Guitar (muted)', 'Overdriven Guitar', 'Distortion Guitar', 'Guitar Harmonics',
  'Acoustic Bass', 'Electric Bass (finger)', 'Electric Bass (pick)', 'Fretless Bass',
  'Slap Bass 1', 'Slap Bass 2', 'Synth Bass 1', 'Synth Bass 2',
  'Violin', 'Viola', 'Cello', 'Contrabass', 'Tremolo Strings', 'Pizzicato Strings', 'Orchestral Harp', 'Timpani',
  'String Ensemble 1', 'String Ensemble 2', 'Synth Strings 1', 'Synth Strings 2',
  'Choir Aahs', 'Voice Oohs', 'Synth Voice', 'Orchestra Hit',
  'Trumpet', 'Trombone', 'Tuba', 'Muted Trumpet', 'French Horn', 'Brass Section', 'Synth Brass 1', 'Synth Brass 2',
  'Soprano Sax', 'Alto Sax', 'Tenor Sax', 'Baritone Sax', 'Oboe', 'English Horn', 'Bassoon', 'Clarinet',
  'Piccolo', 'Flute', 'Recorder', 'Pan Flute', 'Blown Bottle', 'Shakuhachi', 'Whistle', 'Ocarina',
  'Lead 1 (square)', 'Lead 2 (sawtooth)', 'Lead 3 (calliope)', 'Lead 4 (chiff)',
  'Lead 5 (charang)', 'Lead 6 (voice)', 'Lead 7 (fifths)', 'Lead 8 (bass + lead)',
  'Pad 1 (new age)', 'Pad 2 (warm)', 'Pad 3 (polysynth)', 'Pad 4 (choir)',
  'Pad 5 (bowed)', 'Pad 6 (metallic)', 'Pad 7 (halo)', 'Pad 8 (sweep)',
  'FX 1 (rain)', 'FX 2 (soundtrack)', 'FX 3 (crystal)', 'FX 4 (atmosphere)',
  'FX 5 (brightness)', 'FX 6 (goblins)', 'FX 7 (echoes)', 'FX 8 (sci-fi)',
  'Sitar', 'Banjo', 'Shamisen', 'Koto', 'Kalimba', 'Bag Pipe', 'Fiddle', 'Shanai',
  'Tinkle Bell', 'Agogo', 'Steel Drums', 'Woodblock', 'Taiko Drum', 'Melodic Tom', 'Synth Drum', 'Reverse Cymbal',
  'Guitar Fret Noise', 'Breath Noise', 'Seashore', 'Bird Tweet', 'Telephone Ring', 'Helicopter', 'Applause', 'Gunshot'
]

export const GM_PROGRAM_OPTIONS = GM_NAMES.map((label, value) => ({
  label: `${String(value).padStart(3, '0')} · ${label}`,
  value
}))

export const MIDI_CHANNEL_OPTIONS = Array.from({ length: 16 }, (_, index) => ({
  label: `Channel ${index + 1}`,
  value: index
}))

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  if (!audioContext) audioContext = new AudioContextClass()
  return audioContext
}

function buildImpulse(context, seconds = 1.45, decay = 2.7) {
  const length = Math.max(1, Math.floor(context.sampleRate * seconds))
  const impulse = context.createBuffer(2, length, context.sampleRate)
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel)
    for (let i = 0; i < length; i += 1) {
      const envelope = Math.pow(1 - i / length, decay)
      data[i] = (Math.random() * 2 - 1) * envelope
    }
  }
  return impulse
}

function getMasterBus(context) {
  if (masterBus?.context === context) return masterBus

  const input = context.createGain()
  const dry = context.createGain()
  const wet = context.createGain()
  const convolver = context.createConvolver()
  const compressor = context.createDynamicsCompressor()
  const output = context.createGain()

  dry.gain.value = 0.92
  wet.gain.value = 0.13
  convolver.buffer = buildImpulse(context)
  compressor.threshold.value = -18
  compressor.knee.value = 18
  compressor.ratio.value = 3.2
  compressor.attack.value = 0.004
  compressor.release.value = 0.18
  output.gain.value = 0.82

  input.connect(dry)
  dry.connect(compressor)
  input.connect(convolver)
  convolver.connect(wet)
  wet.connect(compressor)
  compressor.connect(output)
  output.connect(context.destination)

  masterBus = { context, input, output }
  return masterBus
}

function loadScript(src, readyTest) {
  if (typeof window === 'undefined') return Promise.reject(new Error('Browser audio is unavailable'))
  if (readyTest?.()) return Promise.resolve()
  if (scriptLoads.has(src)) return scriptLoads.get(src)

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error(`Unable to load ${src}`)), { once: true })
    document.head.appendChild(script)
  })
  scriptLoads.set(src, promise)
  promise.catch(() => scriptLoads.delete(src))
  return promise
}

async function ensureWebAudioFontPlayer(context) {
  await loadScript(WEB_AUDIO_FONT_URL, () => Boolean(window.WebAudioFontPlayer))
  if (!webAudioFontPlayer) webAudioFontPlayer = new window.WebAudioFontPlayer()
  webAudioFontPlayer.resumeContext?.(context)
  return webAudioFontPlayer
}

async function ensureSoundFontProgram(program = currentProgram) {
  const context = getAudioContext()
  if (!context) throw new Error('Web Audio is unavailable')
  const normalizedProgram = Math.max(0, Math.min(127, Math.round(Number(program) || 0)))
  if (soundFontPresets.has(normalizedProgram)) return soundFontPresets.get(normalizedProgram)

  const player = await ensureWebAudioFontPlayer(context)
  const index = player.loader.findInstrument(normalizedProgram)
  const info = player.loader.instrumentInfo(index)
  if (!info?.url || !info?.variable) throw new Error(`No SoundFont preset for program ${normalizedProgram}`)

  player.loader.startLoad(context, info.url, info.variable)
  await new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('SoundFont loading timed out')), 20000)
    player.loader.waitLoad(() => {
      window.clearTimeout(timeout)
      resolve()
    })
  })

  const preset = window[info.variable]
  if (!preset) throw new Error(`SoundFont preset ${info.variable} did not load`)
  soundFontPresets.set(normalizedProgram, preset)
  return preset
}

async function requestMidiAccessInternal() {
  if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') {
    throw new Error('Web MIDI is not supported by this browser')
  }
  if (!midiAccess) {
    try {
      midiAccess = await navigator.requestMIDIAccess({ software: true })
    } catch {
      midiAccess = await navigator.requestMIDIAccess()
    }
  }
  if (!midiOutputId) midiOutputId = [...midiAccess.outputs.values()][0]?.id || ''
  return midiAccess
}

function selectedMidiOutput() {
  if (!midiAccess) return null
  return midiAccess.outputs.get(midiOutputId) || [...midiAccess.outputs.values()][0] || null
}

function sendMidiProgram(force = false) {
  const output = selectedMidiOutput()
  if (!output) return
  const key = `${output.id}:${midiChannel}:${currentProgram}`
  if (!force && lastMidiProgram === key) return
  output.send([0xC0 | midiChannel, currentProgram])
  lastMidiProgram = key
  output.send([0xB0 | midiChannel, 64, sustainEnabled ? 127 : 0])
}

export async function requestMidiOutputs() {
  const access = await requestMidiAccessInternal()
  return [...access.outputs.values()].map((output) => ({
    label: `${output.name || 'MIDI output'}${output.manufacturer ? ` · ${output.manufacturer}` : ''}`,
    value: output.id
  }))
}

export function setMidiOutput(id) {
  midiOutputId = String(id || '')
  lastMidiProgram = null
  sendMidiProgram(true)
}

export function setMidiChannel(channel) {
  midiChannel = Math.max(0, Math.min(15, Math.round(Number(channel) || 0)))
  lastMidiProgram = null
  sendMidiProgram(true)
}

export async function setInstrumentProgram(program) {
  currentProgram = Math.max(0, Math.min(127, Math.round(Number(program) || 0)))
  lastMidiProgram = null
  if (currentEngine === 'soundfont') await ensureSoundFontProgram(currentProgram)
  if (currentEngine === 'web-midi') sendMidiProgram(true)
}

export function setSustain(enabled) {
  sustainEnabled = Boolean(enabled)
  const output = selectedMidiOutput()
  if (output) output.send([0xB0 | midiChannel, 64, sustainEnabled ? 127 : 0])
}

export async function configureAudioEngine(engine, options = {}) {
  const allowed = new Set(AUDIO_ENGINE_OPTIONS.map((item) => item.value))
  currentEngine = allowed.has(engine) ? engine : 'electric-piano'
  if (options.program !== undefined) currentProgram = Math.max(0, Math.min(127, Math.round(Number(options.program) || 0)))
  if (options.channel !== undefined) midiChannel = Math.max(0, Math.min(15, Math.round(Number(options.channel) || 0)))
  if (options.outputId !== undefined) midiOutputId = String(options.outputId || '')

  if (currentEngine === 'soundfont') await ensureSoundFontProgram(currentProgram)
  if (currentEngine === 'web-midi') {
    await requestMidiAccessInternal()
    sendMidiProgram(true)
  }
  return currentEngine
}

export async function ensureAudioReady() {
  if (currentEngine === 'web-midi') {
    await requestMidiAccessInternal()
    sendMidiProgram()
    return midiAccess
  }

  const context = getAudioContext()
  if (!context) return null
  if (context.state === 'suspended') await context.resume()
  getMasterBus(context)
  if (currentEngine === 'soundfont') await ensureSoundFontProgram(currentProgram)
  return context
}

export function midiToFrequency(midi) {
  return 440 * Math.pow(2, (Number(midi) - 69) / 12)
}

function makeDriveCurve(amount = 18) {
  const size = 1024
  const curve = new Float32Array(size)
  const k = Math.max(1, Number(amount) || 18)
  for (let i = 0; i < size; i += 1) {
    const x = i * 2 / (size - 1) - 1
    curve[i] = ((3 + k) * x * 20 * Math.PI / 180) / (Math.PI + k * Math.abs(x))
  }
  return curve
}

function createBasicVoice(context, midi, velocity, start) {
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
  gain.connect(getMasterBus(context).input)

  oscillator.start(start)
  overtone.start(start)
  return {
    type: 'webaudio', context, oscillators: [oscillator, overtone], modulators: [], gain,
    sustain: Math.max(0.001, velocity * 0.72), stopped: false
  }
}

function createElectricPianoVoice(context, midi, velocity, start) {
  const frequency = midiToFrequency(midi)
  const mix = context.createGain()
  const filter = context.createBiquadFilter()
  const drive = context.createWaveShaper()
  const amp = context.createGain()
  const body = context.createOscillator()
  const tine = context.createOscillator()
  const bell = context.createOscillator()
  const bodyGain = context.createGain()
  const tineGain = context.createGain()
  const bellGain = context.createGain()
  const tremolo = context.createOscillator()
  const tremoloDepth = context.createGain()

  body.type = 'sine'
  body.frequency.setValueAtTime(frequency, start)
  tine.type = 'triangle'
  tine.frequency.setValueAtTime(frequency * 2, start)
  tine.detune.setValueAtTime(2.5, start)
  bell.type = 'sine'
  bell.frequency.setValueAtTime(frequency * 4.02, start)

  bodyGain.gain.setValueAtTime(0.80, start)
  tineGain.gain.setValueAtTime(0.34, start)
  tineGain.gain.exponentialRampToValueAtTime(0.0001, start + 1.25)
  bellGain.gain.setValueAtTime(0.20, start)
  bellGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.34)

  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(Math.min(7200, 2600 + velocity * 18000), start)
  filter.frequency.exponentialRampToValueAtTime(1750, start + 0.55)
  filter.Q.setValueAtTime(0.72, start)

  drive.curve = makeDriveCurve(13)
  drive.oversample = '2x'

  const sustain = Math.max(0.001, velocity * 0.63)
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.96), start + 0.006)
  amp.gain.exponentialRampToValueAtTime(sustain, start + 0.16)

  tremolo.type = 'sine'
  tremolo.frequency.setValueAtTime(5.15, start)
  tremoloDepth.gain.setValueAtTime(Math.max(0.006, velocity * 0.055), start)
  tremolo.connect(tremoloDepth)
  tremoloDepth.connect(amp.gain)

  body.connect(bodyGain)
  tine.connect(tineGain)
  bell.connect(bellGain)
  bodyGain.connect(mix)
  tineGain.connect(mix)
  bellGain.connect(mix)
  mix.connect(filter)
  filter.connect(drive)
  drive.connect(amp)
  amp.connect(getMasterBus(context).input)

  body.start(start)
  tine.start(start)
  bell.start(start)
  tremolo.start(start)

  return {
    type: 'webaudio', context, oscillators: [body, tine, bell], modulators: [tremolo], gain: amp,
    sustain, stopped: false
  }
}

async function createSoundFontVoice(context, midi, velocity, start) {
  const player = await ensureWebAudioFontPlayer(context)
  const preset = await ensureSoundFontProgram(currentProgram)
  const envelope = player.queueWaveTable(
    context,
    getMasterBus(context).input,
    preset,
    start,
    Number(midi),
    60,
    Math.max(0.08, Math.min(0.82, velocity * 4.2))
  )
  return { type: 'soundfont', context, envelope, stopped: false }
}

async function createMidiVoice(midi, velocity, when) {
  await requestMidiAccessInternal()
  const output = selectedMidiOutput()
  if (!output) throw new Error('No MIDI output is available')
  sendMidiProgram()
  const note = Math.max(0, Math.min(127, Math.round(Number(midi))))
  const velocityByte = Math.max(1, Math.min(127, Math.round(Math.max(0.08, velocity * 4.5) * 127)))
  const timestamp = performance.now() + Math.max(0, Number(when) || 0) * 1000
  output.send([0x90 | midiChannel, note, velocityByte], timestamp)
  return { type: 'midi', output, channel: midiChannel, note, stopped: false }
}

export async function startMidi(midi, velocity = 0.14, when = 0) {
  await ensureAudioReady()
  if (currentEngine === 'web-midi') return createMidiVoice(midi, velocity, when)

  const context = getAudioContext()
  if (!context) return null
  const start = context.currentTime + Math.max(0, when)
  if (currentEngine === 'soundfont') return createSoundFontVoice(context, midi, velocity, start)
  if (currentEngine === 'basic-synth') return createBasicVoice(context, Number(midi), velocity, start)
  return createElectricPianoVoice(context, Number(midi), velocity, start)
}

function stopWebAudioVoice(voice, releaseSeconds, when) {
  const now = voice.context.currentTime + Math.max(0, when)
  const release = Math.max(0.035, sustainEnabled ? Math.max(0.8, releaseSeconds) : releaseSeconds)
  if (typeof voice.gain.gain.cancelAndHoldAtTime === 'function') voice.gain.gain.cancelAndHoldAtTime(now)
  else {
    voice.gain.gain.cancelScheduledValues(now)
    voice.gain.gain.setValueAtTime(voice.sustain, now)
  }
  voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + release)
  ;[...(voice.oscillators || []), ...(voice.modulators || [])].forEach((oscillator) => {
    try { oscillator.stop(now + release + 0.035) } catch { /* already stopped */ }
  })
}

export function stopMidiVoice(voice, releaseSeconds = 0.12, when = 0) {
  if (!voice || voice.stopped) return
  voice.stopped = true
  const delayMs = Math.max(0, Number(when) || 0) * 1000

  if (voice.type === 'midi') {
    const timestamp = performance.now() + delayMs
    voice.output.send([0x80 | voice.channel, voice.note, 0], timestamp)
    return
  }

  if (voice.type === 'soundfont') {
    const cancel = () => {
      try { voice.envelope?.cancel?.() } catch { /* envelope may already be complete */ }
    }
    const delay = delayMs + (sustainEnabled ? 700 : 0)
    if (delay > 0) window.setTimeout(cancel, delay)
    else cancel()
    return
  }

  stopWebAudioVoice(voice, Math.max(0.035, releaseSeconds), when)
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
  const release = Math.min(0.28, Math.max(0.06, held * 0.18))
  stopMidiVoice(voice, release, Math.max(0, when) + held)
}

export async function playChord(midis, durationSeconds = 0.5, velocity = 0.12, when = 0) {
  const unique = [...new Set((midis || []).map(Number).filter(Number.isFinite))]
  await Promise.all(unique.map((midi) => playMidi(midi, durationSeconds, velocity, when)))
}
