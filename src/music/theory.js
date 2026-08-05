export const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
export const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']
export const NATURAL_PITCH_CLASSES = new Set([0, 2, 4, 5, 7, 9, 11])
export const MAJOR_SCALE_OFFSETS = [0, 2, 4, 5, 7, 9, 11]
export const STANDARD_GUITAR_MIDI_LOW_TO_HIGH = [40, 45, 50, 55, 59, 64]

export const MAJOR_KEYS = [
  { id: 'Cb', label: 'C♭', tonic: 11, signature: -7, accidentalMode: 'flat', relativeMinor: 'A♭ minor', scale: ['C♭', 'D♭', 'E♭', 'F♭', 'G♭', 'A♭', 'B♭'] },
  { id: 'Gb', label: 'G♭', tonic: 6, signature: -6, accidentalMode: 'flat', relativeMinor: 'E♭ minor', scale: ['G♭', 'A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F'] },
  { id: 'Db', label: 'D♭', tonic: 1, signature: -5, accidentalMode: 'flat', relativeMinor: 'B♭ minor', scale: ['D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭', 'C'] },
  { id: 'Ab', label: 'A♭', tonic: 8, signature: -4, accidentalMode: 'flat', relativeMinor: 'F minor', scale: ['A♭', 'B♭', 'C', 'D♭', 'E♭', 'F', 'G'] },
  { id: 'Eb', label: 'E♭', tonic: 3, signature: -3, accidentalMode: 'flat', relativeMinor: 'C minor', scale: ['E♭', 'F', 'G', 'A♭', 'B♭', 'C', 'D'] },
  { id: 'Bb', label: 'B♭', tonic: 10, signature: -2, accidentalMode: 'flat', relativeMinor: 'G minor', scale: ['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A'] },
  { id: 'F', label: 'F', tonic: 5, signature: -1, accidentalMode: 'flat', relativeMinor: 'D minor', scale: ['F', 'G', 'A', 'B♭', 'C', 'D', 'E'] },
  { id: 'C', label: 'C', tonic: 0, signature: 0, accidentalMode: 'sharp', relativeMinor: 'A minor', scale: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
  { id: 'G', label: 'G', tonic: 7, signature: 1, accidentalMode: 'sharp', relativeMinor: 'E minor', scale: ['G', 'A', 'B', 'C', 'D', 'E', 'F♯'] },
  { id: 'D', label: 'D', tonic: 2, signature: 2, accidentalMode: 'sharp', relativeMinor: 'B minor', scale: ['D', 'E', 'F♯', 'G', 'A', 'B', 'C♯'] },
  { id: 'A', label: 'A', tonic: 9, signature: 3, accidentalMode: 'sharp', relativeMinor: 'F♯ minor', scale: ['A', 'B', 'C♯', 'D', 'E', 'F♯', 'G♯'] },
  { id: 'E', label: 'E', tonic: 4, signature: 4, accidentalMode: 'sharp', relativeMinor: 'C♯ minor', scale: ['E', 'F♯', 'G♯', 'A', 'B', 'C♯', 'D♯'] },
  { id: 'B', label: 'B', tonic: 11, signature: 5, accidentalMode: 'sharp', relativeMinor: 'G♯ minor', scale: ['B', 'C♯', 'D♯', 'E', 'F♯', 'G♯', 'A♯'] },
  { id: 'F#', label: 'F♯', tonic: 6, signature: 6, accidentalMode: 'sharp', relativeMinor: 'D♯ minor', scale: ['F♯', 'G♯', 'A♯', 'B', 'C♯', 'D♯', 'E♯'] },
  { id: 'C#', label: 'C♯', tonic: 1, signature: 7, accidentalMode: 'sharp', relativeMinor: 'A♯ minor', scale: ['C♯', 'D♯', 'E♯', 'F♯', 'G♯', 'A♯', 'B♯'] }
]

export const CIRCLE_OF_FIFTHS = [
  { label: 'C', ids: ['C'], minor: 'A m' },
  { label: 'G', ids: ['G'], minor: 'E m' },
  { label: 'D', ids: ['D'], minor: 'B m' },
  { label: 'A', ids: ['A'], minor: 'F♯ m' },
  { label: 'E', ids: ['E'], minor: 'C♯ m' },
  { label: 'B / C♭', ids: ['B', 'Cb'], minor: 'G♯ / A♭ m' },
  { label: 'F♯ / G♭', ids: ['F#', 'Gb'], minor: 'D♯ / E♭ m' },
  { label: 'C♯ / D♭', ids: ['C#', 'Db'], minor: 'A♯ / B♭ m' },
  { label: 'A♭', ids: ['Ab'], minor: 'F m' },
  { label: 'E♭', ids: ['Eb'], minor: 'C m' },
  { label: 'B♭', ids: ['Bb'], minor: 'G m' },
  { label: 'F', ids: ['F'], minor: 'D m' }
]

export function mod12(value) {
  return ((value % 12) + 12) % 12
}

export function noteName(pitchClass, accidentalMode = 'sharp') {
  return (accidentalMode === 'flat' ? FLAT_NAMES : SHARP_NAMES)[mod12(pitchClass)]
}

export function keyById(id) {
  return MAJOR_KEYS.find((key) => key.id === id) || MAJOR_KEYS.find((key) => key.id === 'C')
}

export function keyPitchClasses(key) {
  return MAJOR_SCALE_OFFSETS.map((offset) => mod12(key.tonic + offset))
}

export function midiOctave(midi) {
  return Math.floor(midi / 12) - 1
}

export function midiLabel(midi, accidentalMode = 'sharp') {
  return `${noteName(midi, accidentalMode)}${midiOctave(midi)}`
}

export function signatureLabel(signature) {
  if (signature === 0) return 'No sharps or flats'
  const symbol = signature > 0 ? '♯' : '♭'
  const count = Math.abs(signature)
  return `${count} ${symbol}${count === 1 ? '' : 's'}`
}
