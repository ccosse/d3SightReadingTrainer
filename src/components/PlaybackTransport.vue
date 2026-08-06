<template>
  <section class="transport" aria-label="Common player-staff tape transport">
    <div class="tape-controls">
      <q-btn
        square
        outline
        color="grey-5"
        :icon="isPlaying ? 'pause' : 'play_arrow'"
        :disable="!isPlaying && !hasPlayableSource"
        :aria-label="isPlaying ? 'Pause the player staff' : 'Play or resume the player staff'"
        @click="togglePlayPause"
      >
        <q-tooltip v-if="store.tooltipsEnabled">
          {{ isPlaying ? 'Pause and freeze the staff exactly where it is.' : 'Play or resume from the frozen tape position.' }}
        </q-tooltip>
      </q-btn>

      <q-btn square outline color="grey-5" icon="stop" :disable="store.srtTransportState === 'stopped'" aria-label="Stop the player staff" @click="store.requestSrtStop">
        <q-tooltip v-if="store.tooltipsEnabled">Stop without rewinding.</q-tooltip>
      </q-btn>

      <q-btn square outline color="grey-5" icon="save" :disable="!hasSaveableMaterial" aria-label="Save the selected region or current staff contents" @click="store.requestSrtSave">
        <q-tooltip v-if="store.tooltipsEnabled">Save the selected region; if nothing is selected, save the current staff contents.</q-tooltip>
      </q-btn>
    </div>

    <q-knob
      :model-value="store.srtTempo"
      :min="30"
      :max="220"
      :step="1"
      size="72px"
      :thickness="0.16"
      color="grey-4"
      track-color="grey-8"
      show-value
      @update:model-value="store.setSrtTempo"
    >
      <div class="knob-value"><strong>{{ store.srtTempo }}</strong><span>BPM</span></div>
      <q-tooltip v-if="store.tooltipsEnabled">Turn for tempo; the tape position does not move.</q-tooltip>
    </q-knob>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const hasPlayableSource = computed(() => store.srtSource === 'generated' || store.hasStaffSequence)
const isPlaying = computed(() => store.srtTransportState === 'playing')
const hasSaveableMaterial = computed(() => store.srtSource === 'generated' || store.hasStaffSequence)

function togglePlayPause() {
  if (isPlaying.value) store.requestSrtPause()
  else store.requestSrtPlay()
}
</script>

<style scoped>
.transport {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  min-height: 76px;
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 0;
  white-space: nowrap;
}
.tape-controls { grid-column: 2; display: flex; justify-content: center; gap: 5px; }
.transport :deep(.q-knob) { grid-column: 3; justify-self: end; }
.tape-controls :deep(.q-btn) { min-width: 46px; min-height: 44px; }
.knob-value { display: grid; place-items: center; line-height: 1.05; font-variant-numeric: tabular-nums; }
.knob-value strong { font-size: 17px; }
.knob-value span { margin-top: 2px; color: #cfcfcf; font-size: 10px; letter-spacing: .04em; }
@media (max-width: 620px) {
  .transport { grid-template-columns: 1fr auto 1fr; }
  .transport :deep(.q-knob) { transform: scale(.88); transform-origin: right center; }
}
</style>
