<template>
  <section class="ladder" aria-label="Interactive key signature ladder">
    <div
      v-for="key in keys"
      :key="key.id"
      class="ladder-row"
      :class="{ active: key.id === store.currentKeyId }"
    >
      <button type="button" class="accidentals" @click="store.setKey(key.id, { mode: 'major' })">
        {{ accidentalText(key.signature) }}
        <q-tooltip v-if="store.tooltipsEnabled">Select {{ key.label }} major: {{ signatureLabel(key.signature) }}.</q-tooltip>
      </button>
      <button type="button" class="major" :class="{ emphasized: key.id === store.currentKeyId && store.currentMode === 'major' }" @click="store.setKey(key.id, { mode: 'major' })">
        {{ key.label }} major
        <q-tooltip v-if="store.tooltipsEnabled">Select {{ key.label }} major.</q-tooltip>
      </button>
      <button type="button" class="minor" :class="{ emphasized: key.id === store.currentKeyId && store.currentMode === 'minor' }" @click="store.setKey(key.id, { mode: 'minor' })">
        {{ key.relativeMinor }}
        <q-tooltip v-if="store.tooltipsEnabled">Select {{ key.relativeMinor }} while preserving this key signature.</q-tooltip>
      </button>
    </div>
  </section>
</template>

<script setup>
import { MAJOR_KEYS, signatureAccidentals, signatureLabel } from '../music/theory'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const keys = MAJOR_KEYS

function accidentalText(signature) {
  const names = signatureAccidentals(signature)
  return names.length ? names.join('  ') : '—'
}
</script>

<style scoped>
.ladder {
  display: grid;
  grid-template-rows: repeat(15, minmax(0, 1fr));
  align-self: stretch;
  min-height: 0;
  background: transparent;
}
.ladder-row {
  display: grid;
  grid-template-columns: minmax(145px, 1.5fr) minmax(82px, 0.78fr) minmax(94px, 0.9fr);
  align-items: stretch;
  min-height: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.09);
  background: transparent;
}
.ladder-row:last-child { border-bottom: 0; }
.ladder-row:hover { background: rgba(255, 255, 255, 0.06); }
.ladder-row.active { background: rgba(44, 143, 207, 0.19); box-shadow: inset 3px 0 0 var(--q-primary); }
.ladder-row button {
  min-width: 0;
  padding: 1px 6px;
  border: 0;
  color: inherit;
  background: transparent;
  text-align: left;
  font: inherit;
  font-size: 18px;
  line-height: 1.12;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.accidentals { color: #28e45f !important; letter-spacing: 0.015em; }
.major { color: #ef7eb8 !important; }
.minor { color: #91b7ff !important; }
.emphasized { font-weight: 800 !important; color: #fff !important; }
@media (max-width: 680px) {
  .ladder { min-height: 390px; }
  .ladder-row { grid-template-columns: minmax(126px, 1.35fr) 0.8fr 0.9fr; }
  .ladder-row button { font-size: 16px; }
}
</style>
