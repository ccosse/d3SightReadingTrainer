<template>
  <section class="transport" aria-label="Common player-staff tape transport">
    <div class="tape-controls">
      <q-btn
        square
        outline
        :color="isPlaying ? 'amber-6' : 'positive'"
        :icon="isPlaying ? 'pause' : 'play_arrow'"
        :disable="!isPlaying && !hasPlayableSource"
        :aria-label="isPlaying ? 'Pause the player staff' : 'Play or resume the player staff'"
        @click="togglePlayPause"
      >
        <q-tooltip>
          {{ isPlaying
            ? 'Pause and freeze the staff exactly where it is.'
            : 'Play or resume from the frozen tape position.' }}
        </q-tooltip>
      </q-btn>

      <q-btn
        square
        outline
        color="negative"
        icon="stop"
        :disable="store.srtTransportState === 'stopped'"
        aria-label="Stop the player staff"
        @click="store.requestSrtStop"
      >
        <q-tooltip>Stop the transport without rewinding. The staff remains frozen at the current tape position.</q-tooltip>
      </q-btn>

      <q-btn
        square
        outline
        color="light-blue-3"
        icon="save"
        :disable="!hasClipSelection"
        aria-label="Save the selected staff region"
        @click="store.requestSrtSave"
      >
        <q-tooltip>Save the currently selected staff region to the clip library.</q-tooltip>
      </q-btn>
    </div>

    <div class="transport-copy">
      <div class="transport-title">{{ transportStateLabel }} · {{ sourceLabel }}</div>
      <div class="transport-detail">{{ detailLabel }}</div>
    </div>

    <div class="tempo-control">
      <span class="tempo-label">{{ store.srtTempo }} BPM</span>
      <q-slider
        :model-value="store.srtTempo"
        :min="30"
        :max="220"
        :step="1"
        color="positive"
        @update:model-value="store.setSrtTempo"
      >
        <q-tooltip>Tempo changes without moving the frozen tape position.</q-tooltip>
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
const transportStateLabel = computed(() => ({
  playing: 'Playing',
  paused: 'Paused',
  stopped: 'Stopped'
}[store.srtTransportState] || 'Stopped'))
const sourceLabel = computed(() => {
  if (store.srtSource === 'staff') return store.hasStaffSequence ? 'manual staff' : 'manual staff is empty'
  return 'endless generated staff'
})

function togglePlayPause() {
  if (isPlaying.value) store.requestSrtPause()
  else store.requestSrtPlay()
}

const detailLabel = computed(() => {
  if (store.srtTransportState === 'paused') return 'Tape position frozen · Play resumes here'
  if (store.srtTransportState === 'stopped') return 'Transport stopped without rewinding · Play resumes here'
  if (store.srtSource === 'staff') {
    return store.hasStaffSequence
      ? `${store.staffClusters.length} time position${store.staffClusters.length === 1 ? '' : 's'} · piano and guitar mirror playback`
      : 'Drop or capture notes into the manual staff, or choose Generated as the source'
  }
  return `${store.srtStyle} · fixed staff scanline · piano and guitar respond like a player piano`
})
</script>

<style scoped>
.transport {
  display: grid;
  grid-template-columns: auto minmax(210px, 1fr) minmax(220px, 0.8fr);
  align-items: center;
  gap: 14px;
  min-height: 62px;
  border: 1px solid #565656;
  border-radius: 9px;
  background: rgba(35, 35, 35, 0.9);
  padding: 8px 11px;
}
.tape-controls :deep(.q-btn) { min-width: 48px; min-height: 46px; }
.transport-title { font-size: 20px; font-weight: 650; color: #fff; }
.transport-detail { font-size: 16px; color: #d0d6d8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tempo-control { display: grid; grid-template-columns: auto minmax(110px, 1fr); align-items: center; gap: 10px; }
.tempo-label { color: #8dffab; font-size: 17px; font-variant-numeric: tabular-nums; white-space: nowrap; }

@media (max-width: 760px) {
  .transport { grid-template-columns: auto 1fr; }
  .tempo-control { grid-column: 1 / -1; }
}
</style>
