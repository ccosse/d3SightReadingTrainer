<template>
  <section class="transport" aria-label="Player-staff tape transport">
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
        <q-tooltip v-if="store.tooltipsEnabled">{{ isPlaying ? 'Pause and freeze the staff exactly where it is.' : 'Play or resume from the frozen tape position.' }}</q-tooltip>
      </q-btn>

      <q-btn square outline color="grey-5" icon="stop" :disable="store.srtTransportState === 'stopped'" aria-label="Stop the player staff" @click="store.requestSrtStop">
        <q-tooltip v-if="store.tooltipsEnabled">Stop without rewinding.</q-tooltip>
      </q-btn>

      <q-btn square outline color="grey-5" icon="save" :disable="!hasSaveableMaterial" aria-label="Save the selected region or current staff contents" @click="store.requestSrtSave">
        <q-tooltip v-if="store.tooltipsEnabled">Save the selected region; if nothing is selected, save the current staff contents as a new clip.</q-tooltip>
      </q-btn>
    </div>
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
.transport { display: flex; align-items: center; justify-content: center; min-height: 56px; border: 0; background: transparent; padding: 2px 0; }
.tape-controls { display: flex; justify-content: center; gap: 6px; }
.tape-controls :deep(.q-btn) { min-width: 48px; min-height: 44px; }
</style>
