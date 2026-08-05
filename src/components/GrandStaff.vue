<template>
  <section>
    <div class="text-subtitle1 q-mb-xs">Bass and treble staffs</div>
    <svg
      class="instrument-svg"
      viewBox="0 0 900 330"
      role="img"
      aria-label="Grand staff with selected pitch classes shown across a practical range"
    >
      <g v-for="staffY in [70, 90, 110, 130, 150, 210, 230, 250, 270, 290]" :key="staffY">
        <line x1="70" :y1="staffY" x2="860" :y2="staffY" class="staff-line" />
      </g>

      <text x="28" y="126" class="clef">𝄞</text>
      <text x="30" y="269" class="bass-clef">𝄢</text>
      <line x1="70" y1="180" x2="860" y2="180" class="ledger-guide" />

      <g v-for="note in displayedNotes" :key="note.midi">
        <line
          v-if="note.needsLedger"
          :x1="note.x - 21"
          :x2="note.x + 21"
          :y1="note.y"
          :y2="note.y"
          class="ledger-line"
        />
        <ellipse
          :cx="note.x"
          :cy="note.y"
          rx="11"
          ry="8"
          class="note-head"
          transform-origin="center"
          :transform="`rotate(-18 ${note.x} ${note.y})`"
          @click="store.togglePitchClass(note.pitchClass)"
        />
        <text :x="note.x" :y="note.y - 15" text-anchor="middle" class="note-name">
          {{ store.noteName(note.pitchClass) }}{{ note.octave }}
        </text>
      </g>
    </svg>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()

// C3 through C5, enough to relate bass staff, middle C, and treble staff.
const NATURAL_PC_TO_STEP = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 }

function diatonicStepFromC3(midi) {
  const pc = midi % 12
  const octave = Math.floor(midi / 12) - 1
  const naturalPc = [0, 2, 4, 5, 7, 9, 11].reduce((best, candidate) => {
    const dBest = Math.min((pc - best + 12) % 12, (best - pc + 12) % 12)
    const dCandidate = Math.min((pc - candidate + 12) % 12, (candidate - pc + 12) % 12)
    return dCandidate < dBest ? candidate : best
  }, 0)
  return (octave - 3) * 7 + NATURAL_PC_TO_STEP[naturalPc]
}

const displayedNotes = computed(() => {
  const notes = []
  const selected = store.selectedSet
  const candidates = []

  for (let midi = 48; midi <= 72; midi += 1) {
    if (selected.has(midi % 12)) candidates.push(midi)
  }

  const spacing = candidates.length > 1 ? 700 / (candidates.length - 1) : 0
  candidates.forEach((midi, index) => {
    const step = diatonicStepFromC3(midi)
    const y = 290 - step * 10
    notes.push({
      midi,
      pitchClass: midi % 12,
      octave: Math.floor(midi / 12) - 1,
      x: candidates.length === 1 ? 465 : 115 + index * spacing,
      y,
      needsLedger: y < 70 || y > 290 || Math.abs(y - 180) < 2
    })
  })

  return notes
})
</script>

<style scoped>
.instrument-svg {
  width: 100%;
  height: auto;
  display: block;
}

.staff-line,
.ledger-line {
  stroke: currentColor;
  stroke-width: 1.3;
}

.ledger-guide {
  stroke: currentColor;
  stroke-width: 1;
  stroke-dasharray: 5 7;
  opacity: 0.2;
}

.note-head {
  fill: var(--q-primary);
  cursor: pointer;
}

.note-name {
  fill: currentColor;
  font-size: 12px;
}

.clef {
  fill: currentColor;
  font-size: 78px;
}

.bass-clef {
  fill: currentColor;
  font-size: 61px;
}
</style>
