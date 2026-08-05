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

const RANGE_PRESETS = {
  comfortable: {
    treble: [60, 79],
    bass: [40, 59]
  },
  wide: {
    treble: [55, 86],
    bass: [33, 64]
  },
  ledgers: {
    treble: [52, 91],
    bass: [28, 67]
  }
}

const MATERIAL_WEIGHTS = [
  ['single', 0.52],
  ['dyad', 0.28],
  ['triad', 0.20]
]

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
  const result = []
  for (let index = 0; index < size; index += 1) {
    result.push(scale[(degree + index * 2) % scale.length])
  }
  return result
}

function voicedChord(key, degree, range, targetCenter, size = 3) {
  const [minMidi, maxMidi] = range
  const pcs = chordPitchClasses(key, degree, size)
  const all = pcs.map((pc) => candidatesForPitchClass(pc, minMidi, maxMidi))
  if (all.some((list) => !list.length)) return []

  const rootCandidates = all[0]
  let best = null
  let bestScore = Infinity

  for (const root of rootCandidates) {
    for (let inversion = 0; inversion < size; inversion += 1) {
      const notes = []
      let last = root
      for (let toneIndex = 0; toneIndex < size; toneIndex += 1) {
        const sourceIndex = (toneIndex + inversion) % size
        const candidates = all[sourceIndex]
        let note = nearest(candidates.filter((value) => value >= last - (toneIndex === 0 ? 24 : 0)), last)
        if (toneIndex > 0) {
          while (note <= last && note + 12 <= maxMidi) note += 12
        }
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
    { label: 'Jazz guitar voicings', value: 'jazz-guitar' },
    { label: 'd3Strato exercises', value: 'strato' }
  ],
  chordSize: [
    { label: 'Triads', value: 'triad' },
    { label: '7th chords', value: 'seventh' }
  ],
  bassPattern: [
    { label: 'Walking', value: 'walk' },
    { label: 'Roots + fifths', value: 'root-fifth' },
    { label: 'Chromatic approach', value: 'chromatic' }
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
    this.lastMidi = {
      treble: 67,
      bass: 48
    }
    this.lastChordCenter = {
      treble: 67,
      bass: 48
    }
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
    const choices = DEGREE_TRANSITIONS[this.harmonyDegree] || DEGREE_TRANSITIONS[0]
    this.harmonyDegree = pick(choices)
    return this.harmonyDegree
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
    if (motion === 'random') {
      chosen = pick(pool)
    } else if (motion === 'stepwise') {
      const scale = keyPitchClasses(key)
      const lastDegree = degreeForPitchClass(key, last)
      const step = weightedPick([[-2, 0.12], [-1, 0.28], [0, 0.18], [1, 0.28], [2, 0.14]])
      const targetPc = scale[mod12(lastDegree + step) % 7]
      chosen = nearest(candidatesForPitchClass(targetPc, minMidi, maxMidi), last + Math.sign(step) * 2)
    } else {
      chosen = nearest(pool, last)
    }

    this.lastMidi[clef] = chosen
    this.lastChordCenter[clef] = chosen
    return [chosen]
  }

  chooseDyad(key, clef, range, motion, harmonyDegree) {
    const [minMidi, maxMidi] = range
    const root = this.chooseSingle(key, clef, range, motion, harmonyDegree)[0]
    const rootDegree = degreeForPitchClass(key, root)
    const intervalSteps = pick([2, 2, 3, 4])
    const targetPc = keyPitchClasses(key)[(rootDegree + intervalSteps) % 7]
    const candidates = candidatesForPitchClass(targetPc, minMidi, maxMidi)
    let top = nearest(candidates, root + (intervalSteps === 2 ? 4 : intervalSteps === 3 ? 5 : 7))
    while (top <= root && top + 12 <= maxMidi) top += 12
    const result = [...new Set([root, top])].sort((a, b) => a - b)
    this.lastChordCenter[clef] = average(result)
    return result
  }

  chooseTriad(key, clef, range, harmonyDegree) {
    const target = this.lastChordCenter[clef]
    const notes = voicedChord(key, harmonyDegree, range, target, 3)
    if (notes.length) {
      this.lastMidi[clef] = notes[Math.floor(notes.length / 2)]
      this.lastChordCenter[clef] = average(notes)
    }
    return notes
  }

  makeForClef({ key, clef, material, motion, rangeName, harmonyDegree }) {
    const range = RANGE_PRESETS[rangeName]?.[clef] || RANGE_PRESETS.comfortable[clef]
    const selectedMaterial = this.chooseMaterial(material)
    if (selectedMaterial === 'triad') return this.chooseTriad(key, clef, range, harmonyDegree)
    if (selectedMaterial === 'dyad') return this.chooseDyad(key, clef, range, motion, harmonyDegree)
    return this.chooseSingle(key, clef, range, motion, harmonyDegree)
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
    const candidates = candidatesForPitchClass(targetPc, 34, 55)
    const chosen = nearest(candidates, this.lastMidi.bass + (beatIndex === 0 ? 0 : 2))
    this.lastMidi.bass = chosen
    return chosen
  }

  walkingChordEvent({ key, beat, duration, chordSize, bassPattern }) {
    const beatIndex = Math.floor(beat) % 4
    if (beatIndex === 0 && this.eventIndex > 0) this.nextHarmonyDegree('voice-led')
    const bass = this.bassNoteForBeat(key, this.harmonyDegree, beatIndex, bassPattern)
    const size = chordSize === 'triad' ? 3 : 4
    const chord = beatIndex % 2 === 0
      ? voicedChord(key, this.harmonyDegree, [55, 82], this.lastChordCenter.treble, size)
      : []
    if (chord.length) this.lastChordCenter.treble = average(chord)
    return { midis: [bass, ...chord], clef: 'both', harmonyDegree: this.harmonyDegree, duration }
  }

  strideEvent({ key, beat, duration, chordSize }) {
    const beatIndex = Math.floor(beat) % 4
    if (beatIndex === 0 && this.eventIndex > 0) this.nextHarmonyDegree('voice-led')
    const size = chordSize === 'triad' ? 3 : 4
    let midis = []
    if (beatIndex % 2 === 0) {
      const bass = this.bassNoteForBeat(key, this.harmonyDegree, beatIndex, 'root-fifth')
      midis = [bass]
    } else {
      const leftChord = voicedChord(key, this.harmonyDegree, [43, 64], 54, Math.min(3, size))
      const melody = this.chooseSingle(key, 'treble', [64, 84], 'chord-tone', this.harmonyDegree)
      midis = [...leftChord, ...melody]
    }
    return { midis, clef: 'both', harmonyDegree: this.harmonyDegree, duration }
  }

  jazzGuitarEvent({ key, beat, duration, chordSize }) {
    if (Math.floor(beat) % 2 === 0 && this.eventIndex > 0) this.nextHarmonyDegree('voice-led')
    const size = chordSize === 'triad' ? 3 : 4
    const chord = voicedChord(key, this.harmonyDegree, [45, 76], this.lastChordCenter.treble, size)
    if (chord.length) this.lastChordCenter.treble = average(chord)
    return { midis: chord, clef: 'treble', harmonyDegree: this.harmonyDegree, duration: Math.max(duration, 1.5) }
  }

  stratoExerciseEvent({ key, duration, exerciseMode, rangeName }) {
    const ranges = RANGE_PRESETS[rangeName] || RANGE_PRESETS.comfortable
    let material = 'single'
    let motion = 'random'
    if (exerciseMode === 'mode-2') motion = 'stepwise'
    if (exerciseMode === 'mode-3') material = 'dyad'
    if (exerciseMode === 'mode-4') { material = 'triad'; motion = 'chord-tone' }
    const harmonyDegree = this.nextHarmonyDegree(motion)
    const midis = material === 'triad'
      ? this.chooseTriad(key, 'treble', ranges.treble, harmonyDegree)
      : material === 'dyad'
        ? this.chooseDyad(key, 'treble', ranges.treble, motion, harmonyDegree)
        : this.chooseSingle(key, 'treble', ranges.treble, motion, harmonyDegree)
    return { midis, clef: 'treble', harmonyDegree, duration }
  }

  generate({ key, beat, duration, material, motion, clefMode, rangeName, style = 'free', chordSize = 'seventh', bassPattern = 'walk', exerciseMode = 'mode-1' }) {
    let styled = null
    if (style === 'walking-chords') styled = this.walkingChordEvent({ key, beat, duration, chordSize, bassPattern })
    else if (style === 'stride') styled = this.strideEvent({ key, beat, duration, chordSize })
    else if (style === 'jazz-guitar') styled = this.jazzGuitarEvent({ key, beat, duration, chordSize })
    else if (style === 'strato') styled = this.stratoExerciseEvent({ key, duration, exerciseMode, rangeName })

    if (styled) {
      this.eventIndex += 1
      return {
        id: `g-${this.eventIndex}-${Math.round(beat * 1000)}`,
        beat,
        duration: styled.duration,
        midis: [...new Set(styled.midis)].sort((a, b) => a - b),
        harmonyDegree: styled.harmonyDegree,
        clef: styled.clef,
        style
      }
    }
    const harmonyDegree = this.nextHarmonyDegree(motion)
    const selectedClef = this.chooseClef(clefMode)
    let midis = []

    if (selectedClef === 'both') {
      const bass = this.makeForClef({
        key,
        clef: 'bass',
        material: material === 'triad' ? 'single' : material === 'mixed' ? 'single' : material,
        motion,
        rangeName,
        harmonyDegree
      })
      const treble = this.makeForClef({
        key,
        clef: 'treble',
        material,
        motion,
        rangeName,
        harmonyDegree
      })
      midis = [...bass, ...treble]
    } else {
      midis = this.makeForClef({
        key,
        clef: selectedClef,
        material,
        motion,
        rangeName,
        harmonyDegree
      })
    }

    this.eventIndex += 1
    return {
      id: `g-${this.eventIndex}-${Math.round(beat * 1000)}`,
      beat,
      duration,
      midis: [...new Set(midis)].sort((a, b) => a - b),
      harmonyDegree,
      clef: selectedClef
    }
  }
}
