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

      <q-btn square outline color="grey-5" icon="save" :disable="!hasClipSelection" aria-label="Save the selected staff region" @click="store.requestSrtSave">
        <q-tooltip v-if="store.tooltipsEnabled">Save the selected staff region to the clip library.</q-tooltip>
      </q-btn>
    </div>

    <div class="tempo-control">
      <span class="tempo-label">{{ store.srtTempo }} BPM</span>
      <q-slider :model-value="store.srtTempo" :min="30" :max="220" :step="1" color="grey-5" @update:model-value="store.setSrtTempo">
        <q-tooltip v-if="store.tooltipsEnabled">Tempo changes without moving the tape position.</q-tooltip>
      </q-slider>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const hasPlayableSource = computed(() => store.srtSource === 'generated' || store.hasStaffSequence)
const isPlaying = computed(() => store.srtTransportState === 'playing')
const hasClipSelection = computed(() => store.clipSelectionStart !== null && store.clipSelectionEnd !== null)

function togglePlayPause() {
  if (isPlaying.value) store.requestSrtPause()
  else store.requestSrtPlay()
}
</script>

<style scoped>
.transport {
  display: grid;
  grid-template-columns: auto minmax(220px, 1fr);
  align-items: center;
  gap: 16px;
  min-height: 58px;
  border: 1px solid #565656;
  border-radius: 9px;
  background: rgba(35, 35, 35, 0.9);
  padding: 7px 10px;
}
.tape-controls { display: flex; gap: 4px; }
.tape-controls :deep(.q-btn) { min-width: 46px; min-height: 44px; }
.tempo-control { display: grid; grid-template-columns: auto minmax(120px, 1fr); align-items: center; gap: 10px; }
.tempo-label { color: #eee; font-size: 17px; font-variant-numeric: tabular-nums; white-space: nowrap; }
@media (max-width: 620px) {
  .transport { grid-template-columns: 1fr; }
}
</style>
