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
  </div>
</template>

<script setup>
import { KEYBOARD_PRESETS } from '../music/keyboardPresets'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
</script>

<style scoped>
.sidebar-settings { display: grid; gap: 8px; }
.sidebar-settings :deep(.q-field__control) { min-height: 42px; background: #292929; }
</style>
