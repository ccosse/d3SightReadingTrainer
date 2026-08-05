<template>
  <section class="fifths-explorer" :class="{ compact }">
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
  }
})
</script>

<style scoped>
.fifths-explorer { display: grid; gap: 10px; }
.fifths-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.95fr) minmax(300px, 1.05fr);
  gap: 10px;
  align-items: center;
}
.fifths-explorer.compact .fifths-grid {
  grid-template-columns: minmax(250px, 0.96fr) minmax(290px, 1.04fr);
}

@media (max-width: 610px) {
  .fifths-grid,
  .fifths-explorer.compact .fifths-grid { grid-template-columns: 1fr; }
}
</style>
