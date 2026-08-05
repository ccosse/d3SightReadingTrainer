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
        />
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
        />
      </div>
    </div>

    <div class="pitch-grid" :role="store.selectionMode === 'single' ? 'radiogroup' : 'group'">
      <q-btn
        label="All"
        no-caps
        dense
        unelevated
        class="pitch-button"
        :class="{ selected: store.isAllSelected }"
        :aria-checked="store.isAllSelected"
        @click="store.selectAll"
      />
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
      />
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
  grid-template-columns: repeat(13, minmax(0, 1fr));
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

@media (max-width: 900px) {
  .pitch-grid { grid-template-columns: repeat(7, minmax(0, 1fr)); }
}

@media (max-width: 520px) {
  .pitch-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
</style>
