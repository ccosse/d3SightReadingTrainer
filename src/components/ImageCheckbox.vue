<template>
  <label class="image-checkbox" :class="{ disabled, 'no-label': !label }">
    <span v-if="label" class="image-checkbox-label">{{ label }}</span>
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <img class="checkbox-image unchecked" :src="checkboxOff" alt="" />
    <img class="checkbox-image checked" :src="checkboxOn" alt="" />
    <q-tooltip v-if="tooltip && store.tooltipsEnabled">{{ tooltip }}</q-tooltip>
  </label>
</template>

<script setup>
import checkboxOff from '../assets/checkbox-off.svg'
import checkboxOn from '../assets/checkbox-on.svg'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()

defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  tooltip: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.image-checkbox {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 22px;
  align-items: center;
  min-height: 28px;
  gap: 10px;
  color: #efefef;
  cursor: pointer;
  user-select: none;
}
.image-checkbox-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.image-checkbox.no-label { grid-template-columns: 22px; gap: 0; min-height: 22px; }
.image-checkbox.no-label .checkbox-image { grid-column: 1; }
.image-checkbox input { position: absolute; opacity: 0; pointer-events: none; }
.checkbox-image { width: 22px; height: 22px; grid-column: 2; grid-row: 1; justify-self: end; }
.checked { display: none; }
.image-checkbox input:checked ~ .unchecked { display: none; }
.image-checkbox input:checked ~ .checked { display: block; }
.image-checkbox:focus-within .checkbox-image { outline: 2px solid var(--asymptopia-green); outline-offset: 2px; }
.image-checkbox.disabled { opacity: 0.45; cursor: default; }
</style>
