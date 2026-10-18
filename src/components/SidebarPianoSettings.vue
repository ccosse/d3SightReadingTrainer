<template>
  <div class="sidebar-settings piano-settings" aria-label="Piano controls">
    <q-select
      :model-value="store.keyboardPreset"
      :options="KEYBOARD_PRESETS"
      option-label="label"
      option-value="id"
      emit-value
      map-options
      dense
      outlined
      dark
      options-dense
      label="Keyboard"
      @update:model-value="store.setKeyboardPreset"
    >
      <q-tooltip v-if="store.tooltipsEnabled">Choose the physical keyboard range displayed in the Piano view.</q-tooltip>
    </q-select>
    <q-checkbox
      :model-value="store.showPianoLabels"
      label="Piano key labels"
      dense
      dark
      @update:model-value="setPianoLabels"
    >
      <q-tooltip v-if="store.tooltipsEnabled">Show note names on piano keys, including during playback.</q-tooltip>
    </q-checkbox>
  </div>
</template>

<script setup>
import { KEYBOARD_PRESETS } from '../music/keyboardPresets'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
function setPianoLabels(value) {
  store.showPianoLabels = Boolean(value)
  try { window.localStorage.setItem('d3srt-show-piano-labels', String(Boolean(value))) } catch { /* optional */ }
}
</script>

<style scoped>
.sidebar-settings { display: grid; gap: 8px; }
.sidebar-settings :deep(.q-field__control) { min-height: 42px; background: #292929; }
</style>
