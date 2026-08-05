<template>
  <section>
    <div class="text-subtitle1 q-mb-xs">Piano keyboard</div>
    <svg
      class="instrument-svg"
      viewBox="0 0 840 190"
      role="img"
      aria-label="Two-octave piano keyboard with selected pitch classes highlighted"
    >
      <g v-for="key in whiteKeys" :key="`w-${key.midi}`">
        <rect
          :x="key.x"
          y="10"
          width="60"
          height="165"
          rx="3"
          class="white-key"
          :class="{ selected: store.isSelected(key.pitchClass) }"
          @click="store.togglePitchClass(key.pitchClass)"
        />
        <text :x="key.x + 30" y="160" text-anchor="middle" class="key-label">
          {{ store.noteName(key.pitchClass) }}
        </text>
      </g>

      <g v-for="key in blackKeys" :key="`b-${key.midi}`">
        <rect
          :x="key.x"
          y="10"
          width="38"
          height="102"
          rx="3"
          class="black-key"
          :class="{ selected: store.isSelected(key.pitchClass) }"
          @click="store.togglePitchClass(key.pitchClass)"
        />
        <text :x="key.x + 19" y="92" text-anchor="middle" class="black-label">
          {{ store.noteName(key.pitchClass) }}
        </text>
      </g>
    </svg>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const WHITE_PCS = new Set([0, 2, 4, 5, 7, 9, 11])
const startMidi = 48 // C3
const endMidi = 71   // B4

const whiteKeys = computed(() => {
  const keys = []
  let whiteIndex = 0
  for (let midi = startMidi; midi <= endMidi; midi += 1) {
    const pitchClass = midi % 12
    if (WHITE_PCS.has(pitchClass)) {
      keys.push({ midi, pitchClass, x: whiteIndex * 60 })
      whiteIndex += 1
    }
  }
  return keys
})

const blackKeys = computed(() => {
  const keys = []
  let whiteIndex = 0
  for (let midi = startMidi; midi <= endMidi; midi += 1) {
    const pitchClass = midi % 12
    if (WHITE_PCS.has(pitchClass)) {
      whiteIndex += 1
      continue
    }
    keys.push({ midi, pitchClass, x: whiteIndex * 60 - 19 })
  }
  return keys
})
</script>

<style scoped>
.instrument-svg {
  width: 100%;
  height: auto;
  display: block;
}

.white-key {
  fill: var(--q-dark-page, #fff);
  stroke: currentColor;
  stroke-width: 1.5;
  cursor: pointer;
}

.black-key {
  fill: #202124;
  stroke: currentColor;
  stroke-width: 1;
  cursor: pointer;
}

.white-key.selected,
.black-key.selected {
  fill: var(--q-primary);
}

.key-label {
  fill: currentColor;
  font-size: 15px;
  pointer-events: none;
}

.black-label {
  fill: white;
  font-size: 12px;
  pointer-events: none;
}
</style>
