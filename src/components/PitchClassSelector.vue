<template>
  <section class="selector" aria-label="Pitch-class selector">
    <div class="pitch-scroll">
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
          <q-tooltip v-if="store.tooltipsEnabled">If any notes are selected, clear them all. If none are selected, select all twelve pitch classes.</q-tooltip>
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
    </div>
  </section>
</template>

<script setup>
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
.selector { border: 0; background: transparent; padding: 2px; }
.pitch-scroll { width: 100%; overflow-x: auto; scrollbar-width: thin; }
.pitch-grid {
  display: grid;
  grid-template-columns: minmax(88px, 1.35fr) repeat(12, minmax(54px, 1fr));
  gap: 5px;
  min-width: 820px;
}
.pitch-button {
  position: relative;
  min-width: 0;
  min-height: 50px;
  color: #f3f3f3;
  background: #414141;
  border: 1px solid #5b5b5b;
}
.pitch-button.in-key {
  background: #414141;
  border-color: #5b5b5b;
  box-shadow: inset 0 -2px 0 rgba(72, 254, 58, 0.78);
}
.pitch-button.in-key.tonic { box-shadow: inset 0 -4px 0 var(--asymptopia-green); }
.pitch-button.selected { color: white; background: var(--q-primary); border-color: #9dd4ff; }
.pitch-name { line-height: 1; font-size: 21px; font-weight: 650; }
.scale-degree { position: absolute; right: 4px; bottom: 2px; color: var(--asymptopia-green); font-size: 14px; line-height: 1; }
.pitch-button.selected .scale-degree { color: #fff; }
.all-none-button { font-size: 1rem; }
@media (max-width: 600px) {
  .selector { padding-inline: 0; }
  .pitch-grid { grid-template-columns: 86px repeat(12, 66px); min-width: max-content; }
  .pitch-button { min-height: 46px; }
  .pitch-name { font-size: 19px; }
}
</style>
