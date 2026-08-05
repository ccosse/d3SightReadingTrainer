<template>
  <section class="key-summary" :class="{ compact }">
    <div class="row items-center justify-between q-mb-md key-heading">
      <div>
        <div :class="compact ? 'text-subtitle1' : 'text-h6'">{{ store.currentKey.label }} major</div>
        <div class="text-caption text-grey-5">
          {{ store.keySignatureSummary }} · Relative {{ store.currentKey.relativeMinor }}
        </div>
      </div>
      <q-toggle v-model="store.showKeyOverlay" dense label="Overlay key" color="positive">
        <q-tooltip>Highlight all seven notes of this major key across every linked view.</q-tooltip>
      </q-toggle>
    </div>
    <div class="row q-gutter-xs">
      <q-chip
        v-for="(name, index) in store.currentKey.scale"
        :key="name"
        clickable
        dense
        color="grey-8"
        text-color="white"
        @click="store.selectPitchClass(scalePitchClasses[index])"
      >
        {{ index + 1 }} · {{ name }}
        <q-tooltip>Select scale degree {{ index + 1 }}, {{ name }}, everywhere.</q-tooltip>
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
const scalePitchClasses = computed(() => keyPitchClasses(store.currentKey))
</script>

<style scoped>
.key-summary {
  border: 1px solid #555;
  border-radius: 12px;
  background: #2b2b2b;
  padding: 16px;
}
.key-summary.compact {
  background: rgba(43, 43, 43, 0.72);
  padding: 12px;
}
@media (max-width: 420px) {
  .key-heading { align-items: flex-start; gap: 8px; }
}
</style>
