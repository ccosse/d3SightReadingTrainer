<template>
  <section class="fifths-explorer" :class="{ compact, stacked }">
    <div class="fifths-grid">
      <KeySignatureLadder />
      <CircleOfFifths />
    </div>
    <KeySummary compact />
  </section>
</template>

<script setup>
import CircleOfFifths from './CircleOfFifths.vue'
import KeySignatureLadder from './KeySignatureLadder.vue'
import KeySummary from './KeySummary.vue'

defineProps({
  compact: {
    type: Boolean,
    default: false
  },
  stacked: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.fifths-explorer { display: grid; gap: 8px; width: 100%; }
.fifths-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.95fr) minmax(360px, 1.05fr);
  gap: 8px;
  align-items: stretch;
}
.fifths-explorer.compact .fifths-grid {
  grid-template-columns: minmax(270px, 0.92fr) minmax(380px, 1.08fr);
}
.fifths-explorer.stacked .fifths-grid { grid-template-columns: 1fr; }

@media (max-width: 720px) {
  .fifths-grid,
  .fifths-explorer.compact .fifths-grid { grid-template-columns: 1fr; }
}
</style>
