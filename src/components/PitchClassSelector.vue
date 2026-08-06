<template>
  <section class="selector" aria-label="Pitch-class selector and playback control">
    <div class="selector-header row items-center justify-between q-col-gutter-md q-mb-sm">
      <div class="row items-center q-gutter-sm control-modes">
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
          class="keyboard-select"
          @update:model-value="store.setKeyboardPreset"
        >
          <q-tooltip v-if="store.tooltipsEnabled">Choose the displayed keyboard range. The Reface CP has 37 mini keys, E2 through E5.</q-tooltip>
        </q-select>

        <q-btn-toggle
          :model-value="store.selectionMode"
          dense
          unelevated
          toggle-color="grey-6"
          color="grey-9"
          text-color="white"
          :options="[
            { label: 'Single', value: 'single' },
            { label: 'Multi', value: 'multi' }
          ]"
          @update:model-value="store.setSelectionMode"
        >
          <q-tooltip v-if="store.tooltipsEnabled">
            Single selects one pitch class at a time. Multi lets you build chords and arbitrary note sets.
          </q-tooltip>
        </q-btn-toggle>

        <q-btn-toggle
          v-model="store.accidentalMode"
          class="accidental-toggle"
          dense
          unelevated
          toggle-color="grey-6"
          color="grey-9"
          text-color="white"
          :options="[
            { label: '♭', value: 'flat' },
            { label: '♯', value: 'sharp' }
          ]"
        >
          <q-tooltip v-if="store.tooltipsEnabled">Choose flat or sharp note-name spelling throughout the workspace.</q-tooltip>
        </q-btn-toggle>
      </div>
    </div>

    <div class="pitch-grid" :role="store.selectionMode === 'single' ? 'radiogroup' : 'group'">
      <q-btn
        label="All/None"
        no-caps
        dense
        unelevated
        class="pitch-button all-none-button"
        :class="{ selected: store.isAllSelected }"
        :aria-checked="store.isAllSelected"
        @click="store.toggleAllNone"
      >
        <q-tooltip v-if="store.tooltipsEnabled">
          If any notes are selected, clear them all. If none are selected, select all twelve pitch classes.
        </q-tooltip>
      </q-btn>

      <q-btn
        v-for="(name, pitchClass) in store.noteNames"
        :key="pitchClass"
        no-caps
        dense
        unelevated
        class="pitch-button"
        :class="{
          selected: store.isSelected(pitchClass) && !store.isAllSelected,
          'in-key': store.isInCurrentKey(pitchClass),
          tonic: store.scaleDegree(pitchClass) === 1
        }"
        :role="store.selectionMode === 'single' ? 'radio' : 'checkbox'"
        :aria-checked="store.isSelected(pitchClass)"
        draggable="true"
        @dragstart="startPitchDrag($event, pitchClass)"
        @dragend="store.clearStaffDragPayload"
        @click="store.selectPitchClass(pitchClass)"
      >
        <span class="pitch-name">{{ name }}</span>
        <span v-if="store.scaleDegree(pitchClass)" class="scale-degree">{{ store.scaleDegree(pitchClass) }}</span>
        <q-tooltip v-if="store.tooltipsEnabled">
          {{ name }}{{ store.scaleDegree(pitchClass) ? ` · degree ${store.scaleDegree(pitchClass)} of ${store.currentKey.label} ${store.currentMode}` : ` · outside ${store.currentMode === 'minor' ? store.currentMinorLabel : store.currentKey.label + ' major'}` }}.
          Drag this note onto the staff to place it.
        </q-tooltip>
      </q-btn>
    </div>

    <ChordPalette />

    <PlaybackTransport class="q-mt-md" />
  </section>
</template>

<script setup>
import ChordPalette from './ChordPalette.vue'
import PlaybackTransport from './PlaybackTransport.vue'
import { KEYBOARD_PRESETS } from '../music/keyboardPresets'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()

function startPitchDrag(event, pitchClass) {
  store.setStaffDragPayload({ type: 'pitch', pitchClass })
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/x-pitch-class', String(pitchClass))
  event.dataTransfer.setData('text/plain', String(pitchClass))
}
</script>

<style scoped>
.selector {
  border: 1px solid #555;
  border-radius: 12px;
  background: #2b2b2b;
  padding: 10px;
}

.pitch-grid {
  display: grid;
  grid-template-columns: minmax(86px, 1.35fr) repeat(12, minmax(0, 1fr));
  gap: 5px;
}

.pitch-button {
  position: relative;
  min-width: 0;
  min-height: 54px;
  color: #f3f3f3;
  background: #414141;
  border: 1px solid #5b5b5b;
}

.pitch-button.in-key {
  background: #35483a;
  border-color: #5f8968;
}

.pitch-button.in-key.tonic { box-shadow: inset 0 -3px 0 #8dffab; }

.pitch-button.selected {
  color: white;
  background: var(--q-primary);
  border-color: #9dd4ff;
}

.pitch-name { line-height: 1; font-size: 22px; font-weight: 650; }
.scale-degree {
  position: absolute;
  right: 4px;
  bottom: 2px;
  color: #b9ffc9;
  font-size: 14px;
  line-height: 1;
}
.pitch-button.selected .scale-degree { color: #fff; }
.all-none-button { font-size: 1.1rem; }
.accidental-toggle :deep(.q-btn) { min-width: 48px; min-height: 44px; padding: 8px 14px; border-radius: 4px !important; font-size: 24px; }
.selector :deep(.q-btn-toggle:first-of-type .q-btn) { min-height: 44px; padding-inline: 16px; font-size: 17px; }
.keyboard-select { width: 214px; }
.keyboard-select :deep(.q-field__control) { min-height: 44px; }

@media (max-width: 900px) {
  .control-modes { width: 100%; justify-content: flex-end; }
  .keyboard-select { width: min(100%, 230px); }
  .pitch-grid { grid-template-columns: repeat(7, minmax(0, 1fr)); }
  .all-none-button { grid-column: span 2; }
}

@media (max-width: 600px) {
  .selector { padding: 7px; }
  .selector-header { gap: 7px; margin-bottom: 7px; }
  .selector-header > .text-subtitle1 { display: none; }
  .control-modes { width: 100%; justify-content: space-between; gap: 5px; }
  .keyboard-select { width: min(100%, 180px); }
  .selector :deep(.q-btn-toggle:first-of-type .q-btn) { min-height: 38px; padding-inline: 9px; font-size: 14px; }
  .accidental-toggle :deep(.q-btn) { min-width: 40px; min-height: 38px; padding: 5px 9px; font-size: 20px; }
  .pitch-grid {
    display: flex;
    gap: 5px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    padding-bottom: 4px;
  }
  .pitch-button { flex: 0 0 58px; min-height: 43px; scroll-snap-align: start; }
  .all-none-button { flex-basis: 86px; font-size: 14px; }
  .pitch-name { font-size: 18px; }
  .scale-degree { font-size: 11px; }
}
</style>
