<template>
  <section class="selector" aria-label="Pitch-class selector and playback control">
    <div class="selector-toolbar">
      <div class="selector-primary-row">
        <q-btn-toggle
          class="mode-toggle selection-toggle"
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
          class="mode-toggle accidental-toggle"
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

        <ChordPalette class="toolbar-chord-palette" />

        <q-btn
          flat
          dense
          round
          class="pitch-panel-toggle"
          :icon="store.pitchPanelOpen ? 'expand_less' : 'piano'"
          :aria-label="store.pitchPanelOpen ? 'Collapse note buttons' : 'Show note buttons'"
          @click="store.pitchPanelOpen = !store.pitchPanelOpen"
        >
          <q-tooltip v-if="store.tooltipsEnabled">{{ store.pitchPanelOpen ? 'Collapse the twelve note buttons.' : 'Show the twelve note buttons.' }}</q-tooltip>
        </q-btn>
      </div>
    </div>

    <q-slide-transition>
      <div v-show="store.pitchPanelOpen" class="pitch-grid" :role="store.selectionMode === 'single' ? 'radiogroup' : 'group'">
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
    </q-slide-transition>
  </section>
</template>

<script setup>
import ChordPalette from './ChordPalette.vue'
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
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 3px;
}
.selector-toolbar {
  display: flex;
  justify-content: center;
  width: 100%;
}
.selector-primary-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: min(980px, 100%);
  min-width: 0;
}
.mode-toggle { flex: 0 0 auto; }
.mode-toggle :deep(.q-btn) {
  width: 68px;
  min-width: 68px;
  min-height: 44px;
  padding: 0 10px;
  border-radius: 4px !important;
  font-size: 16px;
}
.accidental-toggle :deep(.q-btn) { font-size: 22px; }
.toolbar-chord-palette {
  flex: 1 1 480px;
  min-width: 260px;
  max-width: 620px;
}
.pitch-panel-toggle { flex: 0 0 40px; }
.pitch-grid {
  display: grid;
  grid-template-columns: minmax(86px, 1.35fr) repeat(12, minmax(0, 1fr));
  gap: 5px;
  margin-top: 8px;
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

@media (max-width: 900px) {
  .selector-primary-row { flex-wrap: wrap; }
  .toolbar-chord-palette { order: 3; flex-basis: calc(100% - 48px); max-width: none; }
  .pitch-panel-toggle { order: 4; }
  .pitch-grid { grid-template-columns: repeat(7, minmax(0, 1fr)); }
  .all-none-button { grid-column: span 2; }
}

@media (max-width: 600px) {
  .selector { padding: 5px; }
  .selector-primary-row { gap: 5px; }
  .mode-toggle :deep(.q-btn) { width: 60px; min-width: 60px; min-height: 38px; padding: 0 7px; font-size: 14px; }
  .accidental-toggle :deep(.q-btn) { font-size: 20px; }
  .toolbar-chord-palette { min-width: 0; flex-basis: calc(100% - 43px); }
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
