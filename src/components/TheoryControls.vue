<template>
  <section class="theory-controls" aria-label="Linked theory controls">
    <div class="dial-row">
      <q-knob
        :model-value="store.halfStepsFromC"
        :min="-12"
        :max="12"
        :step="1"
        size="92px"
        :thickness="0.15"
        color="positive"
        track-color="grey-8"
        show-value
        @update:model-value="store.setHalfStepsFromC"
      >
        <div class="dial-value"><strong>{{ signedHalfSteps }}</strong><span>Half steps</span></div>
        <q-tooltip v-if="store.tooltipsEnabled">Transpose from C by semitones. Negative values favor flat spellings; positive values favor sharp spellings where practical.</q-tooltip>
      </q-knob>
    </div>

    <div class="toggle-list">
      <ImageCheckbox v-model="store.showKeyOverlay" label="Show current key" tooltip="Overlay notes of the current major, minor, or blues scale on the fretboard, piano, and staff." />
      <ImageCheckbox v-if="showTonicSelector" v-model="store.keySelectsTonic" label="Key selects tonic" tooltip="In Single mode, choosing a key also selects its tonic note everywhere." />
      <ImageCheckbox v-model="store.tooltipsEnabled" label="Tooltips" tooltip="Globally enable or disable hover explanations throughout the app." />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import ImageCheckbox from './ImageCheckbox.vue'
import { useNoteMapStore } from '../stores/noteMap'

defineProps({ showTonicSelector: { type: Boolean, default: true } })
const store = useNoteMapStore()
const signedHalfSteps = computed(() => store.halfStepsFromC > 0 ? `+${store.halfStepsFromC}` : `${store.halfStepsFromC}`)
</script>

<style scoped>
.theory-controls { display: grid; gap: 10px; padding: 4px 2px 10px; }
.dial-row { display: grid; place-items: center; }
.dial-value { display: grid; place-items: center; line-height: 1.02; font-variant-numeric: tabular-nums; }
.dial-value strong { font-size: 16px; }
.dial-value span { margin-top: 2px; color: #cfcfcf; font-size: 9px; text-transform: uppercase; letter-spacing: .05em; }
.toggle-list { display: grid; gap: 3px; max-width: 320px; width: 100%; justify-self: center; }
</style>
