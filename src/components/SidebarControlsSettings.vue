<template>
  <div class="sidebar-settings controls-settings" aria-label="Note and chord controls">
    <div class="choice-row" role="radiogroup" aria-label="Note selection mode">
      <div class="choice-caption">Selection</div>
      <ImageCheckbox
        class="choice-option"
        :model-value="store.selectionMode === 'single'"
        label="Single"
        tooltip="Select one pitch class at a time."
        @update:model-value="setSelectionMode('single', $event)"
      />
      <ImageCheckbox
        class="choice-option"
        :model-value="store.selectionMode === 'multi'"
        label="Multi"
        tooltip="Keep multiple pitch classes selected for note sets and chords."
        @update:model-value="setSelectionMode('multi', $event)"
      />
    </div>

    <div class="choice-row" role="radiogroup" aria-label="Accidental spelling">
      <div class="choice-caption">Spelling</div>
      <ImageCheckbox
        class="choice-option"
        :model-value="store.accidentalMode === 'flat'"
        label="♭ Flat"
        tooltip="Prefer flat spellings in linked views where either enharmonic spelling is possible."
        @update:model-value="setAccidentalMode('flat', $event)"
      />
      <ImageCheckbox
        class="choice-option"
        :model-value="store.accidentalMode === 'sharp'"
        label="♯ Sharp"
        tooltip="Prefer sharp spellings in linked views where either enharmonic spelling is possible."
        @update:model-value="setAccidentalMode('sharp', $event)"
      />
    </div>

    <ChordPalette compact />
  </div>
</template>

<script setup>
import ChordPalette from './ChordPalette.vue'
import ImageCheckbox from './ImageCheckbox.vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()

function setSelectionMode(mode, checked) {
  // Radio behavior: one choice is always active. Clicking the active choice leaves it active.
  if (checked || store.selectionMode !== mode) store.setSelectionMode(mode)
}

function setAccidentalMode(mode, checked) {
  // Radio behavior: one spelling preference is always active.
  if (checked || store.accidentalMode !== mode) store.accidentalMode = mode
}
</script>

<style scoped>
.sidebar-settings {
  display: grid;
  gap: 8px;
}

.choice-row {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  column-gap: 10px;
  min-height: 30px;
}

.choice-caption {
  color: #d8d8d8;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.choice-option {
  min-width: 0;
}

.choice-option :deep(.image-checkbox) {
  grid-template-columns: minmax(0, 1fr) 22px;
  gap: 6px;
  min-height: 28px;
}

.choice-option :deep(.image-checkbox-label) {
  text-align: right;
  font-size: 13px;
}

@media (max-width: 420px) {
  .choice-row {
    grid-template-columns: 58px minmax(0, 1fr) minmax(0, 1fr);
    column-gap: 7px;
  }
}
</style>
