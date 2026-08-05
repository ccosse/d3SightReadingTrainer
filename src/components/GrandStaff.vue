<template>
  <section class="instrument-section">
    <div class="row items-end justify-between q-mb-sm">
      <div>
        <div class="text-subtitle1 text-weight-medium">Grand staff</div>
        <div class="text-caption text-grey-5">
          Key signature: {{ store.currentKey.label }} major · {{ store.keySignatureSummary }}
        </div>
      </div>
      <q-toggle v-model="store.showKeyOverlay" dense label="Overlay key" color="positive" />
    </div>

    <div class="svg-frame staff-frame">
      <svg
        class="instrument-svg"
        viewBox="0 0 1040 260"
        role="img"
        aria-label="Grand staff with current key signature and linked note highlighting"
      >
        <g v-for="y in staffLines" :key="y">
          <line x1="82" :y1="y" x2="1010" :y2="y" class="staff-line" />
        </g>

        <text x="24" y="125" class="treble-clef">𝄞</text>
        <text x="29" y="218" class="bass-clef">𝄢</text>

        <g v-for="symbol in signatureSymbols" :key="`${symbol.clef}-${symbol.index}`">
          <text :x="symbol.x" :y="symbol.y" class="signature-symbol">{{ symbol.char }}</text>
        </g>

        <line x1="82" y1="141" x2="1010" y2="141" class="middle-c-guide" />

        <g v-for="note in displayedNotes" :key="`${note.midi}-${note.kind}`">
          <line
            v-for="ledgerY in note.ledgerLines"
            :key="ledgerY"
            :x1="note.x - 17"
            :x2="note.x + 17"
            :y1="ledgerY"
            :y2="ledgerY"
            class="ledger-line"
          />
          <ellipse
            :cx="note.x"
            :cy="note.y"
            rx="10"
            ry="7"
            :class="note.kind === 'selected' ? 'selected-head' : 'key-head'"
            :transform="`rotate(-18 ${note.x} ${note.y})`"
            @mouseenter="store.setFocus(`Staff: ${note.label}`)"
            @click="store.selectPitchClass(note.pitchClass)"
          />
          <text :x="note.x" :y="note.y - 13" text-anchor="middle" class="staff-note-label">
            {{ note.label }}
          </text>
        </g>
      </svg>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { midiLabel, mod12 } from '../music/theory'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const staffLines = [71, 85, 99, 113, 127, 155, 169, 183, 197, 211]
const letterOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const pitchLetterSharp = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B']
const pitchLetterFlat = ['C', 'D', 'D', 'E', 'E', 'F', 'G', 'G', 'A', 'A', 'B', 'B']

function diatonicStepFromC4(midi) {
  const pc = mod12(midi)
  const octave = Math.floor(midi / 12) - 1
  const letters = store.accidentalMode === 'flat' ? pitchLetterFlat : pitchLetterSharp
  const letterIndex = letterOrder.indexOf(letters[pc])
  return (octave - 4) * 7 + letterIndex
}

function noteY(midi) {
  return 141 - diatonicStepFromC4(midi) * 7
}

function ledgerLines(y) {
  const values = []
  if (Math.abs(y - 141) < 1) values.push(141)
  for (let line = 57; line >= y; line -= 14) values.push(line)
  for (let line = 225; line <= y; line += 14) values.push(line)
  return values
}

const displayedNotes = computed(() => {
  const candidates = []
  for (let midi = 48; midi <= 83; midi += 1) {
    const pc = mod12(midi)
    const selected = store.isSelected(pc)
    const inKey = store.showKeyOverlay && store.isInCurrentKey(pc)
    if (selected || inKey) {
      candidates.push({ midi, pitchClass: pc, kind: selected ? 'selected' : 'key' })
    }
  }

  const maxNotes = 28
  const sampled = candidates.length > maxNotes
    ? candidates.filter((_, index) => index % Math.ceil(candidates.length / maxNotes) === 0).slice(0, maxNotes)
    : candidates
  const width = 760
  const spacing = sampled.length > 1 ? width / (sampled.length - 1) : 0

  return sampled.map((note, index) => {
    const y = noteY(note.midi)
    return {
      ...note,
      x: sampled.length === 1 ? 600 : 225 + index * spacing,
      y,
      label: midiLabel(note.midi, store.accidentalMode),
      ledgerLines: ledgerLines(y)
    }
  })
})

const signatureSymbols = computed(() => {
  const signature = store.currentKey.signature
  if (signature === 0) return []
  const count = Math.abs(signature)
  const char = signature > 0 ? '♯' : '♭'
  const trebleSharps = [76, 97, 69, 90, 111, 83, 104]
  const bassSharps = [174, 195, 167, 188, 209, 181, 202]
  const trebleFlats = [104, 83, 111, 90, 118, 97, 125]
  const bassFlats = [202, 181, 209, 188, 216, 195, 223]
  const treble = signature > 0 ? trebleSharps : trebleFlats
  const bass = signature > 0 ? bassSharps : bassFlats
  const result = []
  for (let index = 0; index < count; index += 1) {
    const x = 92 + index * 17
    result.push({ clef: 'treble', index, x, y: treble[index], char })
    result.push({ clef: 'bass', index, x, y: bass[index], char })
  }
  return result
})
</script>

<style scoped>
.instrument-svg { width: 100%; height: auto; display: block; }
.svg-frame { overflow: hidden; border-radius: 8px; }
.staff-frame { background: #262626; padding: 4px; }
.staff-line, .ledger-line { stroke: #f1f1f1; stroke-width: 1.25; }
.middle-c-guide { stroke: #8e8e8e; stroke-width: 1; stroke-dasharray: 5 7; opacity: 0.35; }
.treble-clef { fill: #fff; font-size: 73px; }
.bass-clef { fill: #fff; font-size: 54px; }
.signature-symbol { fill: #fff; font-size: 27px; font-weight: 600; }
.selected-head { fill: var(--q-primary); stroke: #d9efff; stroke-width: 1.2; cursor: pointer; }
.key-head { fill: #6f9d72; stroke: #c8e2c7; stroke-width: 1.2; cursor: pointer; opacity: 0.9; }
.staff-note-label { fill: #fff; font-size: 10px; }
</style>
