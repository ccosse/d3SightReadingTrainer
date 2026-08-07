<template>
  <div class="sidebar-settings guitar-settings" aria-label="Guitar controls">
    <div class="dial-center">
      <q-knob
        :model-value="Math.round(store.fretboardZoom * 100)"
        :min="75"
        :max="160"
        :step="5"
        size="82px"
        :thickness="0.16"
        color="positive"
        track-color="grey-8"
        show-value
        @update:model-value="store.setFretboardZoom(Number($event) / 100)"
      >
        <div class="dial-value"><strong>{{ Math.round(store.fretboardZoom * 100) }}%</strong><span>Zoom</span></div>
        <q-tooltip v-if="store.tooltipsEnabled">Zoom the fretboard around its center in both directions.</q-tooltip>
      </q-knob>
    </div>

    <div class="toggle-list">
      <ImageCheckbox v-model="store.showGuitarStrings" label="Strings" tooltip="Show or hide the six guitar strings." />
      <ImageCheckbox v-model="store.showGuitarFrets" label="Frets" tooltip="Show or hide fret wires." />
      <ImageCheckbox v-model="store.showNeckDots" label="Neck dots" tooltip="Show or hide physical fretboard position markers." />
      <ImageCheckbox v-model="store.showFretNumbers" label="Fret numbers" tooltip="Show or hide fret numbers beneath the neck." />
      <ImageCheckbox v-model="store.notesAsDots" label="Note dots" tooltip="Render visible note positions as dots." />
      <ImageCheckbox v-model="store.notesAsNames" label="Note names" tooltip="Write note names at visible fretboard positions." />
      <ImageCheckbox v-model="store.showOctavesFromE" label="Octaves from E" tooltip="Show octave bands counted upward from the open low-E string." />
      <ImageCheckbox v-model="store.showAllNoteNames" label="Every position" tooltip="Show every fretboard note position." />
    </div>
  </div>
</template>

<script setup>
import ImageCheckbox from './ImageCheckbox.vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
</script>

<style scoped>
.sidebar-settings { display: grid; gap: 8px; }
.dial-center { display: grid; place-items: center; }
.dial-value { display: grid; place-items: center; line-height: 1.02; font-variant-numeric: tabular-nums; }
.dial-value strong { font-size: 14px; }
.dial-value span { margin-top: 2px; color: #cfcfcf; font-size: 9px; text-transform: uppercase; letter-spacing: .05em; }
.toggle-list { display: grid; gap: 2px; }
.toggle-list :deep(.image-checkbox) { min-height: 25px; }
.toggle-list :deep(.image-checkbox-label) { font-size: 14px; }
</style>
