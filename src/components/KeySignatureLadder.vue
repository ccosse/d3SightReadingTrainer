<template>
  <section class="ladder" aria-label="Interactive key signature ladder">
    <button
      v-for="key in keys"
      :key="key.id"
      type="button"
      class="ladder-row"
      :class="{ active: key.id === store.currentKeyId }"
      @click="store.setKey(key.id)"
    >
      <span class="accidentals">{{ accidentalText(key.signature) }}</span>
      <span class="major">{{ key.label }} major</span>
      <span class="minor">{{ key.relativeMinor }}</span>
      <q-tooltip>
        Select {{ key.label }} major: {{ signatureLabel(key.signature) }}; relative {{ key.relativeMinor }}.
      </q-tooltip>
    </button>
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
  align-content: start;
  border: 1px solid #505050;
  border-radius: 9px;
  overflow: hidden;
  background: rgba(32, 32, 32, 0.72);
}
.ladder-row {
  display: grid;
  grid-template-columns: minmax(126px, 1.45fr) minmax(72px, 0.75fr) minmax(82px, 0.85fr);
  align-items: center;
  min-height: 25px;
  padding: 2px 7px;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  color: #ddd;
  background: transparent;
  text-align: left;
  font: inherit;
  font-size: 10px;
  cursor: pointer;
}
.ladder-row:last-child { border-bottom: 0; }
.ladder-row:hover { background: rgba(255, 255, 255, 0.07); }
.ladder-row.active {
  background: rgba(44, 143, 207, 0.28);
  box-shadow: inset 3px 0 0 var(--q-primary);
}
.accidentals {
  color: #25d55a;
  white-space: nowrap;
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
}
.major { color: #e46ca9; white-space: nowrap; }
.minor { color: #8db5ff; white-space: nowrap; }

@media (max-width: 560px) {
  .ladder-row { grid-template-columns: minmax(110px, 1.3fr) 0.8fr 0.9fr; font-size: 9px; }
}
</style>
