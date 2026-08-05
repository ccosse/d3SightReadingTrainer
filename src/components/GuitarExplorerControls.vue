<template>
  <section class="controls" aria-label="d3GuitarExplorer linked controls">
    <div class="slider-block">
      <div class="row items-center justify-between">
        <span class="control-heading">Half-steps from C</span>
        <span class="slider-value">{{ signedHalfSteps }}</span>
      </div>
      <q-slider
        :model-value="store.halfStepsFromC"
        :min="-12"
        :max="12"
        :step="1"
        snap
        label
        color="primary"
        @update:model-value="store.setHalfStepsFromC"
      >
        <q-tooltip>
          Transpose from C by semitones. Negative values favor flat spellings; positive values favor sharp spellings where practical.
        </q-tooltip>
      </q-slider>
    </div>

    <div class="toggle-grid">
      <q-toggle v-model="store.showGuitarStrings" dense label="Show strings">
        <q-tooltip>Show or hide the six guitar strings.</q-tooltip>
      </q-toggle>
      <q-toggle v-model="store.showGuitarFrets" dense label="Show frets">
        <q-tooltip>Show or hide fret wires, including the conceptual 23rd and 24th frets beyond the wood.</q-tooltip>
      </q-toggle>
      <q-toggle v-model="store.showNeckDots" dense label="Show neck dots">
        <q-tooltip>Show or hide the physical fretboard position markers.</q-tooltip>
      </q-toggle>
      <q-toggle v-model="store.showFretNumbers" dense label="Show fret numbers">
        <q-tooltip>Show or hide fret numbers beneath the neck.</q-tooltip>
      </q-toggle>
      <q-toggle v-model="store.notesAsDots" dense label="Notes as dots" color="positive">
        <q-tooltip>Render visible note positions as dots, using green for the d3GuitarExplorer visual language.</q-tooltip>
      </q-toggle>
      <q-toggle v-model="store.notesAsNames" dense label="Notes as names" color="positive">
        <q-tooltip>Write note names at visible fretboard positions.</q-tooltip>
      </q-toggle>
      <q-toggle v-model="store.showOctavesFromE" dense label="Octaves from low E">
        <q-tooltip>Add the octave band counted upward from the open low-E string.</q-tooltip>
      </q-toggle>
      <q-toggle v-model="store.showAllNoteNames" dense label="Show every position">
        <q-tooltip>Show every fretboard note position rather than only selected notes and current-key notes.</q-tooltip>
      </q-toggle>
      <q-toggle v-model="store.showKeyOverlay" dense label="Show current key" color="positive">
        <q-tooltip>Overlay all seven notes of the current major key on the fretboard, piano, and staff.</q-tooltip>
      </q-toggle>
      <q-toggle v-model="store.keySelectsTonic" dense label="Key selects tonic">
        <q-tooltip>In Single mode, selecting a key also selects its tonic note everywhere.</q-tooltip>
      </q-toggle>
    </div>

    <div class="slider-block">
      <div class="row items-center justify-between">
        <span class="control-heading">Fretboard zoom</span>
        <span class="slider-value">{{ Math.round(store.fretboardZoom * 100) }}%</span>
      </div>
      <q-slider
        :model-value="store.fretboardZoom"
        :min="0.75"
        :max="1.6"
        :step="0.05"
        snap
        color="primary"
        @update:model-value="store.setFretboardZoom"
      >
        <q-tooltip>Scale the fretboard horizontally; the neck remains SVG and can scroll when enlarged.</q-tooltip>
      </q-slider>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const signedHalfSteps = computed(() => store.halfStepsFromC > 0 ? `+${store.halfStepsFromC}` : `${store.halfStepsFromC}`)
</script>

<style scoped>
.controls {
  display: grid;
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.13);
  padding-top: 12px;
}
.toggle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 10px;
}
.slider-block { padding: 0 4px; }
.control-heading { color: #d8d8d8; font-size: 11px; }
.slider-value { color: #9ed5ff; font-size: 11px; font-variant-numeric: tabular-nums; }

@media (max-width: 480px) {
  .toggle-grid { grid-template-columns: 1fr; }
}
</style>
