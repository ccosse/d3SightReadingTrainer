<template>
  <div class="sidebar-settings controls-settings" aria-label="Note and chord controls">
    <q-btn-toggle
      class="sidebar-toggle"
      :model-value="store.selectionMode"
      spread
      no-caps
      dense
      unelevated
      toggle-color="positive"
      toggle-text-color="black"
      color="grey-9"
      text-color="white"
      :options="[
        { label: 'Single', value: 'single' },
        { label: 'Multi', value: 'multi' }
      ]"
      @update:model-value="store.setSelectionMode"
    >
      <q-tooltip v-if="store.tooltipsEnabled">Single selects one pitch class; Multi builds note sets and chords.</q-tooltip>
    </q-btn-toggle>

    <q-btn-toggle
      v-model="store.accidentalMode"
      class="sidebar-toggle accidental-toggle"
      spread
      dense
      unelevated
      toggle-color="positive"
      toggle-text-color="black"
      color="grey-9"
      text-color="white"
      :options="[
        { label: '♭', value: 'flat' },
        { label: '♯', value: 'sharp' }
      ]"
    >
      <q-tooltip v-if="store.tooltipsEnabled">Choose flat or sharp spelling throughout the linked views.</q-tooltip>
    </q-btn-toggle>

    <ChordPalette compact />
  </div>
</template>

<script setup>
import ChordPalette from './ChordPalette.vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
</script>

<style scoped>
.sidebar-settings { display: grid; gap: 8px; }
.sidebar-toggle { width: 100%; }
.sidebar-toggle :deep(.q-btn) { min-height: 38px; font-size: 14px; }
.accidental-toggle :deep(.q-btn) { font-size: 20px; }
</style>
