<template>
  <section class="feature-placeholder">
    <div class="text-h5 q-mb-sm">{{ title }}</div>
    <div class="text-body1 text-grey-4">{{ text }}</div>
    <div class="text-caption text-grey-6 q-mt-lg">The shared Note Map, key, pitch, and MIDI logic is already available to this tab.</div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  text: { type: String, required: true }
})
</script>

<style scoped>
.feature-placeholder {
  min-height: 340px;
  border: 1px dashed #666;
  border-radius: 12px;
  background: #2b2b2b;
  padding: 28px;
}
</style>
