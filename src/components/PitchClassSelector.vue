<template>
  <section aria-label="Pitch-class selector">
    <div class="row items-center q-col-gutter-sm q-mb-sm">
      <div class="col">
        <div class="text-subtitle1">Pitch classes</div>
        <div class="text-caption text-grey-7">Click note names to highlight them everywhere.</div>
      </div>
      <div class="col-auto row q-gutter-xs">
        <q-btn-toggle
          v-model="store.accidentalMode"
          dense
          unelevated
          toggle-color="primary"
          :options="[
            { label: '♭', value: 'flat' },
            { label: '♯', value: 'sharp' }
          ]"
        />
        <q-btn dense flat label="Clear" @click="store.clearSelection" />
      </div>
    </div>

    <div class="pitch-grid">
      <q-btn
        v-for="(name, pitchClass) in store.noteNames"
        :key="pitchClass"
        :label="name"
        :color="store.isSelected(pitchClass) ? 'primary' : undefined"
        :outline="!store.isSelected(pitchClass)"
        no-caps
        class="pitch-button"
        :aria-pressed="store.isSelected(pitchClass)"
        @click="store.togglePitchClass(pitchClass)"
      />
    </div>
  </section>
</template>

<script setup>
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
</script>

<style scoped>
.pitch-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 6px;
}

.pitch-button {
  min-width: 0;
}

@media (max-width: 700px) {
  .pitch-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}
</style>
