<template>
  <section class="transport" aria-label="Common player-staff tape transport">
    <div class="staff-dials">
      <q-knob
        :model-value="store.srtTempo"
        :min="30"
        :max="220"
        :step="1"
        size="68px"
        :thickness="0.16"
        color="grey-4"
        track-color="grey-8"
        show-value
        @update:model-value="store.setSrtTempo"
      >
        <div class="knob-value"><strong>{{ store.srtTempo }}</strong><span>BPM</span></div>
        <q-tooltip v-if="store.tooltipsEnabled">Turn for tempo; the tape position does not move.</q-tooltip>
      </q-knob>

      <q-knob
        :model-value="visibleBars"
        :min="1"
        :max="6"
        :step="1"
        size="68px"
        :thickness="0.16"
        color="grey-4"
        track-color="grey-8"
        show-value
        @update:model-value="emit('update:visibleBars', Number($event))"
      >
        <div class="knob-value"><strong>{{ visibleBars }}</strong><span>Bars</span></div>
        <q-tooltip v-if="store.tooltipsEnabled">Turn right for more visible bars.</q-tooltip>
      </q-knob>
    </div>

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
        <q-tooltip v-if="store.tooltipsEnabled">Save the selected region; if nothing is selected, save the current staff contents as a new clip.</q-tooltip>
      </q-btn>
    </div>

    <div class="transport-actions">
      <q-btn
        v-if="store.clipSelectionStart !== null"
        flat
        round
        color="grey-4"
        icon="deselect"
        aria-label="Clear selected staff region"
        @click="store.clearClipSelection"
      >
        <q-tooltip v-if="store.tooltipsEnabled">Clear the selected time region.</q-tooltip>
      </q-btn>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useNoteMapStore } from '../stores/noteMap'

defineProps({
  visibleBars: { type: Number, required: true }
})

const emit = defineEmits(['update:visibleBars'])

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
  grid-template-columns: minmax(150px, 1fr) auto minmax(150px, 1fr);
  align-items: center;
  gap: 14px;
  min-height: 78px;
  border: 0;
  background: transparent;
  padding: 0;
  white-space: nowrap;
}
.staff-dials { grid-column: 1; display: flex; align-items: center; gap: 9px; justify-self: start; }
.tape-controls { grid-column: 2; display: flex; justify-content: center; gap: 5px; }
.transport-actions { grid-column: 3; display: flex; justify-content: flex-end; min-width: 44px; }
.tape-controls :deep(.q-btn) { min-width: 46px; min-height: 44px; }
.knob-value { display: grid; place-items: center; line-height: 1.05; font-variant-numeric: tabular-nums; }
.knob-value strong { font-size: 16px; }
.knob-value span { margin-top: 2px; color: #cfcfcf; font-size: 10px; letter-spacing: .04em; }
@media (max-width: 700px) {
  .transport { grid-template-columns: 1fr auto; gap: 8px; }
  .staff-dials { grid-column: 1; }
  .tape-controls { grid-column: 2; }
  .transport-actions { grid-column: 1 / -1; justify-content: center; min-height: 0; }
  .staff-dials :deep(.q-knob) { transform: scale(.88); transform-origin: left center; }
}
</style>
