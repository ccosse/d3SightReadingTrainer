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
        color="grey-5"
        @update:model-value="store.setHalfStepsFromC"
      >
        <q-tooltip v-if="store.tooltipsEnabled">Transpose from C by semitones. Negative values favor flat spellings; positive values favor sharp spellings where practical.</q-tooltip>
      </q-slider>
    </div>

    <div class="toggle-grid">
      <ImageCheckbox v-model="store.showGuitarStrings" label="Show strings" tooltip="Show or hide the six guitar strings." />
      <ImageCheckbox v-model="store.showGuitarFrets" label="Show frets" tooltip="Show or hide fret wires, including the conceptual 23rd and 24th frets beyond the wood." />
      <ImageCheckbox v-model="store.showNeckDots" label="Show neck dots" tooltip="Show or hide the physical fretboard position markers." />
      <ImageCheckbox v-model="store.showFretNumbers" label="Show fret numbers" tooltip="Show or hide fret numbers beneath the neck." />
      <ImageCheckbox v-model="store.notesAsDots" label="Notes as dots" tooltip="Render visible note positions as dots." />
      <ImageCheckbox v-model="store.notesAsNames" label="Notes as names" tooltip="Write note names at visible fretboard positions." />
      <ImageCheckbox v-model="store.showOctavesFromE" label="Octaves from low E" tooltip="Add the octave band counted upward from the open low-E string." />
      <ImageCheckbox v-model="store.showAllNoteNames" label="Show every position" tooltip="Show every fretboard note position rather than only selected notes and current-key notes." />
      <ImageCheckbox v-model="store.showKeyOverlay" label="Show current key" tooltip="Overlay all seven notes of the current key on the fretboard, piano, and staff." />
      <ImageCheckbox v-model="store.keySelectsTonic" label="Key selects tonic" tooltip="In Single mode, selecting a key also selects its tonic note everywhere." />
      <ImageCheckbox v-model="store.tooltipsEnabled" label="Tooltips" tooltip="Globally enable or disable hover explanations throughout the app." />
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
        color="grey-5"
        @update:model-value="store.setFretboardZoom"
      >
        <q-tooltip v-if="store.tooltipsEnabled">Scale the fretboard horizontally; the neck remains SVG and can scroll when enlarged.</q-tooltip>
      </q-slider>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import ImageCheckbox from './ImageCheckbox.vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const signedHalfSteps = computed(() => store.halfStepsFromC > 0 ? `+${store.halfStepsFromC}` : `${store.halfStepsFromC}`)
</script>

<style scoped>
.controls { display: grid; gap: 10px; border-top: 0; padding-top: 4px; }
.toggle-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 10px; }
.slider-block { padding: 0 4px; }
.control-heading, .slider-value { color: #e0e0e0; font-size: 18px; }
.slider-value { font-variant-numeric: tabular-nums; }
@media (max-width: 480px) { .toggle-grid { grid-template-columns: 1fr; } }
</style>
