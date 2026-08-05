<template>
  <section>
    <div class="row items-end q-mb-xs">
      <div class="col">
        <div class="text-subtitle1">Guitar fretboard</div>
        <div class="text-caption text-grey-7">Standard tuning, low E at the bottom; frets 0–12.</div>
      </div>
    </div>

    <svg
      class="instrument-svg"
      viewBox="0 0 1000 310"
      role="img"
      aria-label="Standard guitar fretboard through fret twelve with selected notes highlighted"
    >
      <rect x="74" y="28" width="878" height="232" rx="8" class="neck" />

      <g v-for="fret in fretLines" :key="`fret-${fret.number}`">
        <line :x1="fret.x" y1="28" :x2="fret.x" y2="260" class="fret-line" />
        <text :x="fret.labelX" y="288" text-anchor="middle" class="fret-number">{{ fret.number }}</text>
      </g>

      <line x1="118" y1="28" x2="118" y2="260" class="nut" />

      <g v-for="string in strings" :key="string.index">
        <line x1="74" :y1="string.y" x2="952" :y2="string.y" class="string-line" />
        <text x="36" :y="string.y + 5" text-anchor="middle" class="string-label">
          {{ string.openName }}
        </text>

        <g v-for="note in string.notes" :key="`${string.index}-${note.fret}`">
          <circle
            v-if="store.isSelected(note.pitchClass)"
            :cx="note.x"
            :cy="string.y"
            r="16"
            class="selected-note"
            @click="store.togglePitchClass(note.pitchClass)"
          />
          <text
            :x="note.x"
            :y="string.y + 5"
            text-anchor="middle"
            :class="store.isSelected(note.pitchClass) ? 'selected-note-label' : 'note-label'"
            @click="store.togglePitchClass(note.pitchClass)"
          >
            {{ store.noteName(note.pitchClass) }}
          </text>
        </g>
      </g>
    </svg>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const openStringsLowToHigh = [4, 9, 2, 7, 11, 4] // E A D G B E
const fretCount = 12
const x0 = 74
const openWidth = 44
const firstFretX = x0 + openWidth
const fretWidth = 64

const fretLines = computed(() => {
  const lines = [{ number: 0, x: x0, labelX: x0 + openWidth / 2 }]
  for (let fret = 1; fret <= fretCount; fret += 1) {
    lines.push({
      number: fret,
      x: firstFretX + fret * fretWidth,
      labelX: firstFretX + (fret - 0.5) * fretWidth
    })
  }
  return lines
})

const strings = computed(() => {
  return openStringsLowToHigh.map((openPitchClass, index) => {
    const y = 238 - index * 38
    const notes = []
    for (let fret = 0; fret <= fretCount; fret += 1) {
      notes.push({
        fret,
        pitchClass: (openPitchClass + fret) % 12,
        x: fret === 0
          ? x0 + openWidth / 2
          : firstFretX + (fret - 0.5) * fretWidth
      })
    }
    return {
      index,
      y,
      openName: store.noteName(openPitchClass),
      notes
    }
  })
})
</script>

<style scoped>
.instrument-svg {
  width: 100%;
  height: auto;
  display: block;
}

.neck {
  fill: color-mix(in srgb, currentColor 8%, transparent);
  stroke: currentColor;
  stroke-width: 1.2;
}

.fret-line {
  stroke: currentColor;
  stroke-width: 1;
  opacity: 0.5;
}

.nut {
  stroke: currentColor;
  stroke-width: 5;
}

.string-line {
  stroke: currentColor;
  stroke-width: 1.4;
  opacity: 0.75;
}

.note-label,
.selected-note-label {
  font-size: 12px;
  cursor: pointer;
  user-select: none;
}

.note-label {
  fill: currentColor;
  opacity: 0.42;
}

.selected-note {
  fill: var(--q-primary);
  cursor: pointer;
}

.selected-note-label {
  fill: white;
  font-weight: 600;
}

.string-label,
.fret-number {
  fill: currentColor;
  font-size: 13px;
}
</style>
