<template>
  <section class="column items-start q-gutter-sm q-py-lg">
    <div class="text-h6">{{ title }}</div>
    <div class="text-body1 text-grey-7">{{ text }}</div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  text: { type: String, required: true }
})
</script>
