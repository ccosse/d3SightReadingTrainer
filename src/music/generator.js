import { keyPitchClasses, mod12 } from './theory'

const DEGREE_TRANSITIONS = {
  0: [0, 3, 4, 5, 1],
  1: [4, 6, 3],
  2: [5, 3, 1],
  3: [1, 4, 0, 5],
  4: [0, 5, 3],
  5: [1, 3, 4, 0],
  6: [0, 2]
}

const PROGRESSIONS = {
  'one-six-two-five': [0, 5, 1, 4],
  'two-five-one': [1, 4, 0, 0],
  'one-four-five': [0, 3, 0, 4],
  'minor-turnaround': [0, 5, 1, 4],
  'twelve-bar': [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4]
}

const RANGE_PRESETS = {
  comfortable: { treble: [60, 79], bass: [40, 59] },
  wide: { treble: [55, 86], bass: [33, 64] },
  ledgers: { treble: [52, 91], bass: [28, 67] }
}

const MATERIAL_WEIGHTS = [
  ['single', 0.52],
  ['dyad', 0.28],
  ['triad', 0.20]
]

const RIFF_PATTERNS = {
  'blues-hook': [0, 2, 3, 4, 3, 2, 0, 5],
  pentatonic: [0, 2, 4, 5, 4, 2, 1, 0],
  syncopated: [0, 0, 4, 2, 5, 4, 2, 6],
  gospel: [0, 2, 4, 6, 5, 4, 2, 1]
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function weightedPick(entries) {
  const target = Math.random()
  let sum = 0
  for (const [value, weight] of entries) {
    sum += weight
    if (target <= sum) return value
  }
  return entries[entries.length - 1][0]
}

function nearest(values, target) {
  if (!values.length) return null
  return values.reduce((best, value) => (
    Math.abs(value - target) < Math.abs(best - target) ? value : best
  ), values[0])
}

function average(values) {
  if (!values.length) return 60
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function candidatesForPitchClass(pitchClass, minMidi, maxMidi) {
  const result = []
  for (let midi = minMidi; midi <= maxMidi; midi += 1) {
    if (mod12(midi) === mod12(pitchClass)) result.push(midi)
  }
  return result
}

function scaleMidis(key, minMidi, maxMidi) {
  const set = new Set(keyPitchClasses(key))
  const result = []
  for (let midi = minMidi; midi <= maxMidi; midi += 1) {
    if (set.has(mod12(midi))) result.push(midi)
  }
  return result
}

function degreeForPitchClass(key, pitchClass) {
  return keyPitchClasses(key).indexOf(mod12(pitchClass))
}

function clampToRange(midi, minMidi, maxMidi) {
  let value = midi
  while (value < minMidi) value += 12
  while (value > maxMidi) value -= 12
  return Math.max(minMidi, Math.min(maxMidi, value))
}

function chordPitchClasses(key, degree, size = 3) {
  const scale = keyPitchClasses(key)
  return Array.from({ length: size }, (_, index) => scale[(degree + index * 2) % scale.length])
}

function chordToneCount(chordSize) {
  if (chordSize === 'triad') return 3
  if (chordSize === 'ninth') return 5
  if (chordSize === 'thirteenth') return 6
  return 4
}

function voicedChord(key, degree, range, targetCenter, size = 3) {
  const [minMidi, maxMidi] = range
  const pcs = chordPitchClasses(key, degree, size)
  const all = pcs.map((pc) => candidatesForPitchClass(pc, minMidi, maxMidi))
  if (all.some((list) => !list.length)) return []

  let best = null
  let bestScore = Infinity
  for (const root of all[0]) {
    for (let inversion = 0; inversion < size; inversion += 1) {
      const notes = []
      let last = root
      for (let toneIndex = 0; toneIndex < size; toneIndex += 1) {
        const sourceIndex = (toneIndex + inversion) % size
        const candidates = all[sourceIndex]
        let note = nearest(candidates.filter((value) => value >= last - (toneIndex === 0 ? 24 : 0)), last)
        if (note === null) break
        if (toneIndex > 0) while (note <= last && note + 12 <= maxMidi) note += 12
        note = clampToRange(note, minMidi, maxMidi)
        notes.push(note)
        last = note
      }
      const ordered = [...new Set(notes)].sort((a, b) => a - b)
      if (ordered.length !== size) continue
      const spanPenalty = (ordered[ordered.length - 1] - ordered[0]) * 0.12
      const centerPenalty = Math.abs(average(ordered) - targetCenter)
      const score = centerPenalty + spanPenalty
      if (score < bestScore) {
        bestScore = score
        best = ordered
      }
    }
  }
  return best || []
}

export const SIGHT_READING_OPTIONS = Object.freeze({
  style: [
    { label: 'Free generation', value: 'free' },
    { label: 'Walking bass + chords', value: 'walking-chords' },
    { label: 'Stride + right hand', value: 'stride' },
    { label: 'Boogie woogie', value: 'boogie' },
    { label: 'Riffs + chord stabs', value: 'riff' },
    { label: 'Jazz guitar voicings', value: 'jazz-guitar' },
    { label: 'd3Strato exercises', value: 'strato' }
  ],
  chordSize: [
    { label: 'Triads', value: 'triad' },
    { label: '7th chords', value: 'seventh' },
    { label: '9th chords', value: 'ninth' },
    { label: '13th chords', value: 'thirteenth' }
  ],
  bassPattern: [
    { label: 'Walking', value: 'walk' },
    { label: 'Roots + fifths', value: 'root-fifth' },
    { label: 'Chromatic approach', value: 'chromatic' }
  ],
  progression: [
    { label: 'Adaptive / voice-led', value: 'auto' },
    { label: 'I–vi–ii–V', value: 'one-six-two-five' },
    { label: 'ii–V–I', value: 'two-five-one' },
    { label: 'I–IV–I–V', value: 'one-four-five' },
    { label: 'Minor turnaround', value: 'minor-turnaround' },
    { label: '12-bar blues', value: 'twelve-bar' }
  ],
  riffFlavor: [
    { label: 'Blues hook', value: 'blues-hook' },
    { label: 'Pentatonic', value: 'pentatonic' },
    { label: 'Syncopated', value: 'syncopated' },
    { label: 'Gospel turn', value: 'gospel' }
  ],
  dynamics: [
    { label: 'Even', value: 'even' },
    { label: 'Natural accents', value: 'natural' },
    { label: 'Wide dynamics', value: 'wide' }
  ],
  exerciseMode: [
    { label: 'Mode 1 · random targets', value: 'mode-1' },
    { label: 'Mode 2 · adjacent motion', value: 'mode-2' },
    { label: 'Mode 3 · interval pairs', value: 'mode-3' },
    { label: 'Mode 4 · chord tones', value: 'mode-4' }
  ],
  source: [
    { label: 'Generated', value: 'generated' },
    { label: 'Manual staff', value: 'staff' }
  ],
  material: [
    { label: 'Single notes', value: 'single' },
    { label: 'Dyads', value: 'dyad' },
    { label: 'Triads', value: 'triad' },
    { label: 'Mixed', value: 'mixed' }
  ],
  motion: [
    { label: 'Random in key', value: 'random' },
    { label: 'Stepwise', value: 'stepwise' },
    { label: 'Chord tones', value: 'chord-tone' },
    { label: 'Voice-led', value: 'voice-led' }
  ],
  clefMode: [
    { label: 'Alternate clefs', value: 'alternate' },
    { label: 'Treble', value: 'treble' },
    { label: 'Bass', value: 'bass' },
    { label: 'Both hands', value: 'both' }
  ],
  range: [
    { label: 'Comfortable', value: 'comfortable' },
    { label: 'Wide', value: 'wide' },
    { label: 'Ledger-rich', value: 'ledgers' }
  ],
  spacing: [
    { label: 'Every ½ beat', value: 0.5 },
    { label: 'Every beat', value: 1 },
    { label: 'Every 2 beats', value: 2 }
  ]
})

export class SightReadingGenerator {
  constructor() {
    this.reset()
  }

  reset() {
    this.eventIndex = 0
    this.harmonyDegree = 0
    this.lastBar = -1
    this.lastMidi = { treble: 67, bass: 48 }
    this.lastChordCenter = { treble: 67, bass: 48 }
    this.riffPattern = RIFF_PATTERNS['blues-hook']
    this.lastOutputMidis = []
  }

  chooseClef(mode) {
    if (mode === 'treble' || mode === 'bass' || mode === 'both') return mode
    return this.eventIndex % 2 === 0 ? 'treble' : 'bass'
  }

  nextHarmonyDegree(motion) {
    if (motion === 'random') {
      this.harmonyDegree = Math.floor(Math.random() * 7)
      return this.harmonyDegree
    }
    this.harmonyDegree = pick(DEGREE_TRANSITIONS[this.harmonyDegree] || DEGREE_TRANSITIONS[0])
    return this.harmonyDegree
  }

  harmonyForBeat(beat, progression, motion = 'voice-led') {
    const bar = Math.floor(beat / 4)
    if (progression !== 'auto' && PROGRESSIONS[progression]) {
      this.harmonyDegree = PROGRESSIONS[progression][bar % PROGRESSIONS[progression].length]
      this.lastBar = bar
      return this.harmonyDegree
    }
    if (bar !== this.lastBar) {
      if (this.lastBar >= 0) this.nextHarmonyDegree(motion)
      this.lastBar = bar
    }
    return this.harmonyDegree
  }

  velocityForBeat(beat, dynamics = 'natural', isChord = false) {
    const phase = ((beat % 4) + 4) % 4
    if (dynamics === 'even') return isChord ? 0.088 : 0.145
    const accent = phase < 0.01 ? 1.18 : Math.abs(phase - 2) < 0.01 ? 1.06 : 0.91
    const spread = dynamics === 'wide' ? 0.035 : 0.016
    const human = (Math.random() - 0.5) * spread
    const base = isChord ? 0.085 : 0.145
    return Math.max(0.045, Math.min(0.19, base * accent + human))
  }

  chooseMaterial(material) {
    return material === 'mixed' ? weightedPick(MATERIAL_WEIGHTS) : material
  }

  chooseSingle(key, clef, range, motion, harmonyDegree) {
    const [minMidi, maxMidi] = range
    const candidates = scaleMidis(key, minMidi, maxMidi)
    const last = this.lastMidi[clef]
    let pool = candidates
    if (motion === 'chord-tone' || motion === 'voice-led') {
      const chordSet = new Set(chordPitchClasses(key, harmonyDegree, 3))
      pool = candidates.filter((midi) => chordSet.has(mod12(midi)))
    }

    let chosen
    if (motion === 'random') chosen = pick(pool)
    else if (motion === 'stepwise') {
      const scale = keyPitchClasses(key)
      const lastDegree = Math.max(0, degreeForPitchClass(key, last))
      const step = weightedPick([[-2, 0.12], [-1, 0.28], [0, 0.18], [1, 0.28], [2, 0.14]])
      const targetPc = scale[((lastDegree + step) % 7 + 7) % 7]
      chosen = nearest(candidatesForPitchClass(targetPc, minMidi, maxMidi), last + Math.sign(step) * 2)
    } else chosen = nearest(pool, last)

    this.lastMidi[clef] = chosen
    this.lastChordCenter[clef] = chosen
    return [chosen]
  }

  chooseDyad(key, clef, range, motion, harmonyDegree) {
    const [minMidi, maxMidi] = range
    const root = this.chooseSingle(key, clef, range, motion, harmonyDegree)[0]
    const rootDegree = Math.max(0, degreeForPitchClass(key, root))
    const intervalSteps = pick([2, 2, 3, 4])
    const targetPc = keyPitchClasses(key)[(rootDegree + intervalSteps) % 7]
    let top = nearest(candidatesForPitchClass(targetPc, minMidi, maxMidi), root + (intervalSteps === 2 ? 4 : intervalSteps === 3 ? 5 : 7))
    while (top <= root && top + 12 <= maxMidi) top += 12
    const result = [...new Set([root, top])].sort((a, b) => a - b)
    this.lastChordCenter[clef] = average(result)
    return result
  }

  chooseChord(key, clef, range, harmonyDegree, chordSize = 'triad') {
    const notes = voicedChord(key, harmonyDegree, range, this.lastChordCenter[clef], chordToneCount(chordSize))
    if (notes.length) {
      this.lastMidi[clef] = notes[Math.floor(notes.length / 2)]
      this.lastChordCenter[clef] = average(notes)
    }
    return notes
  }

  makeForClef({ key, clef, material, motion, rangeName, harmonyDegree }) {
    const range = RANGE_PRESETS[rangeName]?.[clef] || RANGE_PRESETS.comfortable[clef]
    const selectedMaterial = this.chooseMaterial(material)
    const effectiveMotion = motion === 'voice-led' && Math.random() < 0.34 ? 'stepwise' : motion
    if (selectedMaterial === 'triad') return this.chooseChord(key, clef, range, harmonyDegree, 'triad')
    if (selectedMaterial === 'dyad') return this.chooseDyad(key, clef, range, effectiveMotion, harmonyDegree)
    return this.chooseSingle(key, clef, range, effectiveMotion, harmonyDegree)
  }

  bassNoteForBeat(key, degree, beatIndex, pattern = 'walk') {
    const scale = keyPitchClasses(key)
    const rootPc = scale[degree % 7]
    const fifthPc = scale[(degree + 4) % 7]
    const thirdPc = scale[(degree + 2) % 7]
    let targetPc = rootPc
    if (pattern === 'root-fifth') targetPc = beatIndex % 2 === 0 ? rootPc : fifthPc
    else if (pattern === 'chromatic' && beatIndex === 3) targetPc = mod12(rootPc - 1)
    else targetPc = [rootPc, thirdPc, fifthPc, scale[(degree + 5) % 7]][beatIndex % 4]
    const chosen = nearest(candidatesForPitchClass(targetPc, 34, 55), this.lastMidi.bass + (beatIndex === 0 ? 0 : 2))
    this.lastMidi.bass = chosen
    return chosen
  }

  walkingChordEvent({ key, beat, duration, chordSize, bassPattern, progression }) {
    const beatIndex = Math.floor(beat) % 4
    const degree = this.harmonyForBeat(beat, progression)
    const bass = this.bassNoteForBeat(key, degree, beatIndex, bassPattern)
    const chord = beatIndex % 2 === 0
      ? this.chooseChord(key, 'treble', [55, 87], degree, chordSize)
      : []
    return { midis: [bass, ...chord], clef: 'both', harmonyDegree: degree, duration, isChord: chord.length > 0 }
  }

  strideEvent({ key, beat, duration, chordSize, progression }) {
    const beatIndex = Math.floor(beat) % 4
    const degree = this.harmonyForBeat(beat, progression)
    let midis = []
    if (beatIndex % 2 === 0) midis = [this.bassNoteForBeat(key, degree, beatIndex, 'root-fifth')]
    else {
      const leftChord = voicedChord(key, degree, [43, 65], 54, Math.min(4, chordToneCount(chordSize)))
      const melody = this.chooseSingle(key, 'treble', [64, 88], 'chord-tone', degree)
      midis = [...leftChord, ...melody]
    }
    return { midis, clef: 'both', harmonyDegree: degree, duration, isChord: midis.length > 1 }
  }

  jazzGuitarEvent({ key, beat, duration, chordSize, progression }) {
    const degree = this.harmonyForBeat(beat, progression)
    const chord = this.chooseChord(key, 'treble', [45, 79], degree, chordSize)
    return { midis: chord, clef: 'treble', harmonyDegree: degree, duration: Math.max(duration, 1.4), isChord: true }
  }

  boogieEvent({ key, beat, duration, chordSize, progression }) {
    const degree = this.harmonyForBeat(beat, progression)
    const scale = keyPitchClasses(key)
    const rootPc = scale[degree]
    const halfIndex = Math.floor(beat * 2) % 8
    const pattern = [0, 7, 9, 7, 10, 9, 7, -1]
    const bassPc = mod12(rootPc + pattern[halfIndex])
    const bass = nearest(candidatesForPitchClass(bassPc, 34, 55), this.lastMidi.bass + (halfIndex < 4 ? 2 : -1))
    this.lastMidi.bass = bass
    const stab = [0, 3, 4, 7].includes(halfIndex)
      ? this.chooseChord(key, 'treble', [60, 88], degree, chordSize)
      : []
    return { midis: [bass, ...stab], clef: 'both', harmonyDegree: degree, duration: Math.max(0.35, duration), isChord: stab.length > 0 }
  }

  riffEvent({ key, beat, duration, chordSize, progression, riffFlavor }) {
    const degree = this.harmonyForBeat(beat, progression)
    const scale = keyPitchClasses(key)
    const pattern = RIFF_PATTERNS[riffFlavor] || RIFF_PATTERNS['blues-hook']
    const index = Math.floor(beat * 2) % pattern.length
    const targetDegree = (degree + pattern[index]) % 7
    const targetPc = scale[targetDegree]
    const melody = nearest(candidatesForPitchClass(targetPc, 62, 91), this.lastMidi.treble + (index < 4 ? 2 : -2))
    this.lastMidi.treble = melody
    const chordStab = index === 0 || index === 5
      ? this.chooseChord(key, 'treble', [55, 84], degree, chordSize)
      : []
    const bass = index === 0 ? [this.bassNoteForBeat(key, degree, 0, 'root-fifth')] : []
    return { midis: [...bass, ...chordStab, melody], clef: bass.length ? 'both' : 'treble', harmonyDegree: degree, duration, isChord: chordStab.length > 0 }
  }

  stratoExerciseEvent({ key, duration, exerciseMode, rangeName, progression, beat }) {
    const ranges = RANGE_PRESETS[rangeName] || RANGE_PRESETS.comfortable
    let material = 'single'
    let motion = 'random'
    if (exerciseMode === 'mode-2') motion = 'stepwise'
    if (exerciseMode === 'mode-3') material = 'dyad'
    if (exerciseMode === 'mode-4') { material = 'triad'; motion = 'chord-tone' }
    const harmonyDegree = this.harmonyForBeat(beat, progression, motion)
    const midis = material === 'triad'
      ? this.chooseChord(key, 'treble', ranges.treble, harmonyDegree, 'triad')
      : material === 'dyad'
        ? this.chooseDyad(key, 'treble', ranges.treble, motion, harmonyDegree)
        : this.chooseSingle(key, 'treble', ranges.treble, motion, harmonyDegree)
    return { midis, clef: 'treble', harmonyDegree, duration, isChord: midis.length > 1 }
  }

  decorateEvent(event, style, beat, duration) {
    const phase = ((Number(beat) % 4) + 4) % 4
    const downbeat = phase < 0.001
    const restChance = style === 'free' ? 0.08 : style === 'riff' ? 0.06 : style === 'boogie' ? 0.035 : 0.02
    const tieChance = style === 'free' ? 0.11 : style === 'riff' ? 0.08 : 0

    if (!downbeat && style !== 'strato' && style !== 'jazz-guitar' && Math.random() < restChance) {
      return {
        ...event,
        midis: [],
        isRest: true,
        restClef: event.clef === 'bass' ? 'bass' : event.clef === 'both' ? (Math.random() < 0.5 ? 'bass' : 'treble') : 'treble',
        duration: Math.max(0.5, Number(duration) || 1)
      }
    }

    if (!downbeat && tieChance > 0 && this.lastOutputMidis.length > 0 && event.midis.length <= 2 && Math.random() < tieChance) {
      return {
        ...event,
        midis: [...this.lastOutputMidis],
        tieFromPrevious: true,
        silent: true,
        isChord: this.lastOutputMidis.length > 1,
        duration: Math.max(0.25, Number(duration) || 1)
      }
    }

    this.lastOutputMidis = [...event.midis]
    return event
  }

  generate({ key, beat, duration, material, motion, clefMode, rangeName, style = 'free', chordSize = 'seventh', bassPattern = 'walk', exerciseMode = 'mode-1', progression = 'auto', riffFlavor = 'blues-hook', dynamics = 'natural' }) {
    let styled = null
    if (style === 'walking-chords') styled = this.walkingChordEvent({ key, beat, duration, chordSize, bassPattern, progression })
    else if (style === 'stride') styled = this.strideEvent({ key, beat, duration, chordSize, progression })
    else if (style === 'boogie') styled = this.boogieEvent({ key, beat, duration, chordSize, progression })
    else if (style === 'riff') styled = this.riffEvent({ key, beat, duration, chordSize, progression, riffFlavor })
    else if (style === 'jazz-guitar') styled = this.jazzGuitarEvent({ key, beat, duration, chordSize, progression })
    else if (style === 'strato') styled = this.stratoExerciseEvent({ key, beat, duration, exerciseMode, rangeName, progression })

    if (styled) {
      this.eventIndex += 1
      return this.decorateEvent({
        id: `g-${this.eventIndex}-${Math.round(beat * 1000)}`,
        beat,
        duration: styled.duration,
        midis: [...new Set(styled.midis)].sort((a, b) => a - b),
        harmonyDegree: styled.harmonyDegree,
        clef: styled.clef,
        style,
        velocity: this.velocityForBeat(beat, dynamics, styled.isChord)
      }, style, beat, styled.duration)
    }

    const harmonyDegree = this.harmonyForBeat(beat, progression, motion)
    const selectedClef = this.chooseClef(clefMode)
    let midis = []
    if (selectedClef === 'both') {
      const bass = this.makeForClef({ key, clef: 'bass', material: material === 'triad' ? 'single' : material === 'mixed' ? 'single' : material, motion, rangeName, harmonyDegree })
      const treble = this.makeForClef({ key, clef: 'treble', material, motion, rangeName, harmonyDegree })
      midis = [...bass, ...treble]
    } else midis = this.makeForClef({ key, clef: selectedClef, material, motion, rangeName, harmonyDegree })

    this.eventIndex += 1
    return this.decorateEvent({
      id: `g-${this.eventIndex}-${Math.round(beat * 1000)}`,
      beat,
      duration,
      midis: [...new Set(midis)].sort((a, b) => a - b),
      harmonyDegree,
      clef: selectedClef,
      velocity: this.velocityForBeat(beat, dynamics, midis.length > 1)
    }, style, beat, duration)
  }
}
