import { keyPitchClasses, mod12, noteName } from './theory'

const MAJOR_TRIADS = [
  { suffix: '', roman: 'I' },
  { suffix: 'm', roman: 'ii' },
  { suffix: 'm', roman: 'iii' },
  { suffix: '', roman: 'IV' },
  { suffix: '', roman: 'V' },
  { suffix: 'm', roman: 'vi' },
  { suffix: '°', roman: 'vii°' }
]

const MAJOR_SEVENTHS = [
  { suffix: 'maj7', roman: 'Imaj7' },
  { suffix: 'm7', roman: 'ii7' },
  { suffix: 'm7', roman: 'iii7' },
  { suffix: 'maj7', roman: 'IVmaj7' },
  { suffix: '7', roman: 'V7' },
  { suffix: 'm7', roman: 'vi7' },
  { suffix: 'm7♭5', roman: 'viiø7' }
]

const MINOR_TRIADS = [
  { suffix: 'm', roman: 'i' },
  { suffix: '°', roman: 'ii°' },
  { suffix: '', roman: 'III' },
  { suffix: 'm', roman: 'iv' },
  { suffix: 'm', roman: 'v' },
  { suffix: '', roman: 'VI' },
  { suffix: '', roman: 'VII' }
]

const MINOR_SEVENTHS = [
  { suffix: 'm7', roman: 'i7' },
  { suffix: 'm7♭5', roman: 'iiø7' },
  { suffix: 'maj7', roman: 'IIImaj7' },
  { suffix: 'm7', roman: 'iv7' },
  { suffix: 'm7', roman: 'v7' },
  { suffix: 'maj7', roman: 'VImaj7' },
  { suffix: '7', roman: 'VII7' }
]

function activeScaleNames(key, mode) {
  return mode === 'minor'
    ? [5, 6, 0, 1, 2, 3, 4].map((index) => key.scale[index])
    : key.scale
}

function stackedPitchClasses(scale, degree, count) {
  return Array.from({ length: count }, (_, index) => scale[(degree + index * 2) % 7])
}

function chromaticPitchClasses(root, intervals) {
  return intervals.map((interval) => mod12(root + interval))
}

export function voicePitchClasses(pitchClasses, center = 64, minMidi = 36, maxMidi = 96) {
  const pcs = [...new Set((pitchClasses || []).map(mod12))]
  if (!pcs.length) return []

  let best = []
  let bestScore = Infinity
  for (let root = minMidi; root <= maxMidi; root += 1) {
    if (mod12(root) !== pcs[0]) continue
    const notes = [root]
    let last = root
    for (let index = 1; index < pcs.length; index += 1) {
      let note = last + 1
      while (note <= maxMidi && mod12(note) !== pcs[index]) note += 1
      if (note > maxMidi) break
      notes.push(note)
      last = note
    }
    if (notes.length !== pcs.length) continue
    const average = notes.reduce((sum, value) => sum + value, 0) / notes.length
    const span = notes[notes.length - 1] - notes[0]
    const score = Math.abs(average - center) + span * 0.08
    if (score < bestScore) {
      bestScore = score
      best = notes
    }
  }
  return best
}

function makeOption({ id, category, roman, rootName, suffix, pitchClasses, accidentalMode, center = 64, description = '' }) {
  const midis = voicePitchClasses(pitchClasses, center)
  const notes = pitchClasses.map((pc) => noteName(pc, accidentalMode))
  return {
    id,
    category,
    roman,
    chordName: `${rootName}${suffix}`,
    label: `${roman} · ${rootName}${suffix}`,
    notes,
    pitchClasses,
    midis,
    description
  }
}

export function buildChordPalette(key, mode = 'major', accidentalMode = key.accidentalMode) {
  const scale = keyPitchClasses(key, mode)
  const scaleNames = activeScaleNames(key, mode)
  const triads = mode === 'minor' ? MINOR_TRIADS : MAJOR_TRIADS
  const sevenths = mode === 'minor' ? MINOR_SEVENTHS : MAJOR_SEVENTHS
  const options = []

  for (let degree = 0; degree < 7; degree += 1) {
    options.push(makeOption({
      id: `triad-${degree}`,
      category: 'Diatonic triads',
      roman: triads[degree].roman,
      rootName: scaleNames[degree],
      suffix: triads[degree].suffix,
      pitchClasses: stackedPitchClasses(scale, degree, 3),
      accidentalMode,
      center: degree === 0 ? 60 : 64,
      description: `Diatonic triad on scale degree ${degree + 1}`
    }))
  }

  for (let degree = 0; degree < 7; degree += 1) {
    options.push(makeOption({
      id: `seventh-${degree}`,
      category: 'Diatonic sevenths',
      roman: sevenths[degree].roman,
      rootName: scaleNames[degree],
      suffix: sevenths[degree].suffix,
      pitchClasses: stackedPitchClasses(scale, degree, 4),
      accidentalMode,
      center: 64,
      description: `Diatonic seventh chord on scale degree ${degree + 1}`
    }))
  }

  const tonicPc = scale[0]
  const secondPc = scale[1]
  const fourthPc = scale[3]
  const dominantPc = scale[4]
  const sixthPc = scale[5]
  const tonicName = scaleNames[0]
  const secondName = scaleNames[1]
  const fourthName = scaleNames[3]
  const dominantName = scaleNames[4]
  const sixthName = scaleNames[5]
  const tonicMinor = mode === 'minor'

  const advanced = [
    { id: 'tonic-69', roman: tonicMinor ? 'i6/9' : 'I6/9', rootName: tonicName, suffix: tonicMinor ? 'm6/9' : '6/9', pcs: chromaticPitchClasses(tonicPc, tonicMinor ? [0, 3, 7, 9, 14] : [0, 4, 7, 9, 14]) },
    { id: 'tonic-9', roman: tonicMinor ? 'i9' : 'Imaj9', rootName: tonicName, suffix: tonicMinor ? 'm9' : 'maj9', pcs: chromaticPitchClasses(tonicPc, tonicMinor ? [0, 3, 7, 10, 14] : [0, 4, 7, 11, 14]) },
    { id: 'second-9', roman: tonicMinor ? 'iiø9' : 'ii9', rootName: secondName, suffix: tonicMinor ? 'm9♭5' : 'm9', pcs: chromaticPitchClasses(secondPc, tonicMinor ? [0, 3, 6, 10, 14] : [0, 3, 7, 10, 14]) },
    { id: 'fourth-9', roman: tonicMinor ? 'iv9' : 'IVmaj9', rootName: fourthName, suffix: tonicMinor ? 'm9' : 'maj9', pcs: chromaticPitchClasses(fourthPc, tonicMinor ? [0, 3, 7, 10, 14] : [0, 4, 7, 11, 14]) },
    { id: 'dominant-9', roman: 'V9', rootName: dominantName, suffix: '9', pcs: chromaticPitchClasses(dominantPc, [0, 4, 7, 10, 14]) },
    { id: 'dominant-13', roman: 'V13', rootName: dominantName, suffix: '13', pcs: chromaticPitchClasses(dominantPc, [0, 4, 7, 10, 14, 21]) },
    { id: 'dominant-flat9', roman: 'V7♭9', rootName: dominantName, suffix: '7♭9', pcs: chromaticPitchClasses(dominantPc, [0, 4, 7, 10, 13]) },
    { id: 'dominant-sharp9', roman: 'V7♯9', rootName: dominantName, suffix: '7♯9', pcs: chromaticPitchClasses(dominantPc, [0, 4, 7, 10, 15]) },
    { id: 'dominant-flat5', roman: 'V7♭5', rootName: dominantName, suffix: '7♭5', pcs: chromaticPitchClasses(dominantPc, [0, 4, 6, 10]) },
    { id: 'sixth-9', roman: tonicMinor ? 'VImaj9' : 'vi9', rootName: sixthName, suffix: tonicMinor ? 'maj9' : 'm9', pcs: chromaticPitchClasses(sixthPc, tonicMinor ? [0, 4, 7, 11, 14] : [0, 3, 7, 10, 14]) },
    { id: 'tonic-sus4', roman: tonicMinor ? 'isus4' : 'Isus4', rootName: tonicName, suffix: 'sus4', pcs: chromaticPitchClasses(tonicPc, [0, 5, 7]) }
  ]

  advanced.forEach((chord) => options.push(makeOption({
    id: chord.id,
    category: 'Color and advanced',
    roman: chord.roman,
    rootName: chord.rootName,
    suffix: chord.suffix,
    pitchClasses: chord.pcs,
    accidentalMode,
    center: 65,
    description: 'Color/extended voicing'
  })))

  return options
}
