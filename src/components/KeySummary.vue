<template>
  <section class="key-summary" :class="{ compact }">
    <div class="summary-line">
      <strong>{{ activeKeyName }}</strong>
      <span class="summary-meta">· {{ store.keySignatureSummary }} · Relative {{ relativeName }}</span>
    </div>
    <div class="degree-row">
      <q-chip
        v-for="(name, index) in store.activeScaleNames"
        :key="name"
        clickable
        dense
        color="grey-8"
        text-color="white"
        @click="store.selectPitchClass(scalePitchClasses[index])"
      >
        {{ index + 1 }} · {{ name }}
        <q-tooltip v-if="store.tooltipsEnabled">Select scale degree {{ index + 1 }}, {{ name }}, everywhere.</q-tooltip>
      </q-chip>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { keyPitchClasses } from '../music/theory'
import { useNoteMapStore } from '../stores/noteMap'

defineProps({
  compact: {
    type: Boolean,
    default: false
  }
})

const store = useNoteMapStore()
const scalePitchClasses = computed(() => keyPitchClasses(store.currentKey, store.currentMode))
const activeKeyName = computed(() => store.currentMode === 'minor' ? store.currentMinorLabel : `${store.currentKey.label} major`)
const relativeName = computed(() => store.currentMode === 'minor' ? `${store.currentKey.label} major` : store.currentKey.relativeMinor)
</script>

<style scoped>
.key-summary {
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 7px 4px 8px;
  text-align: center;
}
.key-summary.compact { padding: 6px 3px 7px; }
.summary-line {
  display: flex;
  justify-content: center;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 24px;
  font-size: 15px;
}
.summary-line strong { font-size: 16px; font-weight: 750; }
.summary-meta { color: #bdbdbd; font-size: 13px; }
.degree-row {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 4px;
}
.degree-row :deep(.q-chip) { margin: 0; }
</style>
