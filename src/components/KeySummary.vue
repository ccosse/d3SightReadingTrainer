<template>
  <section class="key-summary">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6">{{ store.currentKey.label }} major</div>
        <div class="text-caption text-grey-5">
          {{ store.keySignatureSummary }} · Relative {{ store.currentKey.relativeMinor }}
        </div>
      </div>
      <q-toggle v-model="store.showKeyOverlay" label="Overlay this key everywhere" color="positive" />
    </div>
    <div class="row q-gutter-sm">
      <q-chip
        v-for="(name, index) in store.currentKey.scale"
        :key="name"
        clickable
        color="grey-8"
        text-color="white"
        @click="store.selectPitchClass(scalePitchClasses[index])"
      >{{ index + 1 }} · {{ name }}</q-chip>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { keyPitchClasses } from '../music/theory'
import { useNoteMapStore } from '../stores/noteMap'

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
</style>
