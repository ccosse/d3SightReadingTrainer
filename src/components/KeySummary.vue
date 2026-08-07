<template>
  <section class="key-summary" :class="{ compact }">
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
</script>

<style scoped>
.key-summary {
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 4px 4px 8px;
  text-align: center;
}
.key-summary.compact { padding: 3px 3px 7px; }
.degree-row {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px;
}
.degree-row :deep(.q-chip) { margin: 0; }
</style>
