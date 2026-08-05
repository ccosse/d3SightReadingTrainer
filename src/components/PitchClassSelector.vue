<template>
  <section class="selector" aria-label="Pitch-class selector">
    <div class="row items-center justify-between q-col-gutter-md q-mb-sm">
      <div>
        <div class="text-subtitle1 text-weight-medium">Find note</div>
        <div class="text-caption text-grey-5">
          Single-note radio selection is the default; switch to Multi for chords and sets.
        </div>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-btn-toggle
          :model-value="store.selectionMode"
          dense
          unelevated
          toggle-color="primary"
          color="grey-9"
          text-color="white"
          :options="[
            { label: 'Single', value: 'single' },
            { label: 'Multi', value: 'multi' }
          ]"
          @update:model-value="store.setSelectionMode"
        >
          <q-tooltip>
            Single selects one pitch class at a time. Multi lets you build chords and arbitrary note sets.
          </q-tooltip>
        </q-btn-toggle>

        <q-btn-toggle
          v-model="store.accidentalMode"
          dense
          unelevated
          toggle-color="primary"
          color="grey-9"
          text-color="white"
          :options="[
            { label: '♭', value: 'flat' },
            { label: '♯', value: 'sharp' }
          ]"
        >
          <q-tooltip>Choose flat or sharp note-name spelling throughout the workspace.</q-tooltip>
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
        <q-tooltip>
          If any notes are selected, clear them all. If none are selected, select all twelve pitch classes.
        </q-tooltip>
      </q-btn>

      <q-btn
        v-for="(name, pitchClass) in store.noteNames"
        :key="pitchClass"
        :label="name"
        no-caps
        dense
        unelevated
        class="pitch-button"
        :class="{ selected: store.isSelected(pitchClass) && !store.isAllSelected }"
        :role="store.selectionMode === 'single' ? 'radio' : 'checkbox'"
        :aria-checked="store.isSelected(pitchClass)"
        @click="store.selectPitchClass(pitchClass)"
      >
        <q-tooltip>{{ store.isSelected(pitchClass) ? `Deselect or replace with ${name}` : `Highlight ${name} everywhere` }}</q-tooltip>
      </q-btn>
    </div>
  </section>
</template>

<script setup>
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
</script>

<style scoped>
.selector {
  border: 1px solid #555;
  border-radius: 12px;
  background: #2b2b2b;
  padding: 14px;
}

.pitch-grid {
  display: grid;
  grid-template-columns: minmax(86px, 1.35fr) repeat(12, minmax(0, 1fr));
  gap: 5px;
}

.pitch-button {
  min-width: 0;
  min-height: 34px;
  color: #f3f3f3;
  background: #414141;
  border: 1px solid #5b5b5b;
}

.pitch-button.selected {
  color: white;
  background: var(--q-primary);
  border-color: #9dd4ff;
}

.all-none-button { font-size: 0.78rem; }

@media (max-width: 900px) {
  .pitch-grid { grid-template-columns: repeat(7, minmax(0, 1fr)); }
  .all-none-button { grid-column: span 2; }
}

@media (max-width: 520px) {
  .pitch-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .all-none-button { grid-column: span 2; }
}
</style>
