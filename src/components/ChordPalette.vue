<template>
  <div class="chord-palette">
    <q-select
      v-model="selectedId"
      :options="visibleOptions"
      option-label="displayLabel"
      option-value="id"
      emit-value
      map-options
      dark
      dense
      outlined
      options-dense
      label="Chord to drag"
      class="chord-select"
    >
      <template #option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
            <q-item-label caption class="text-grey-5">{{ scope.opt.notes.join(' · ') }}</q-item-label>
          </q-item-section>
          <q-item-section side><span class="category-copy">{{ scope.opt.category }}</span></q-item-section>
        </q-item>
      </template>
      <q-tooltip>Choose a key-aware chord. Drag the gold chord button onto the staff at the desired time and register.</q-tooltip>
    </q-select>

    <q-btn
      v-if="selectedChord"
      no-caps
      unelevated
      color="amber-9"
      text-color="white"
      icon="drag_indicator"
      class="chord-drag-button"
      draggable="true"
      @dragstart="startChordDrag"
      @dragend="store.clearStaffDragPayload"
      @click="audition"
    >
      <span class="chord-name">{{ selectedChord.chordName }}</span>
      <span class="chord-notes">{{ selectedChord.notes.join('–') }}</span>
      <q-tooltip>Click to hear it. Drag it onto the staff to place the complete voicing.</q-tooltip>
    </q-btn>

    <q-toggle v-model="showAdvanced" dense color="amber-5" label="Advanced" class="advanced-toggle">
      <q-tooltip>Show 6/9, 9th, 13th, altered dominant, and suspended chords.</q-tooltip>
    </q-toggle>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ensureAudioReady, playChord } from '../music/audio'
import { buildChordPalette } from '../music/chords'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const showAdvanced = ref(false)
const selectedId = ref('seventh-4')

const palette = computed(() => buildChordPalette(store.currentKey, store.currentMode, store.accidentalMode))
const visibleOptions = computed(() => palette.value
  .filter((option) => showAdvanced.value || option.category !== 'Color and advanced')
  .map((option) => ({ ...option, displayLabel: `${option.label} · ${option.notes.join('–')}` })))
const selectedChord = computed(() => palette.value.find((option) => option.id === selectedId.value) || visibleOptions.value[0] || null)

watch([() => store.currentKeyId, () => store.currentMode], () => {
  if (!palette.value.some((option) => option.id === selectedId.value)) selectedId.value = 'seventh-4'
})

function startChordDrag(event) {
  if (!selectedChord.value) return
  store.setStaffDragPayload({
    type: 'chord',
    label: selectedChord.value.chordName,
    midis: selectedChord.value.midis,
    pitchClasses: selectedChord.value.pitchClasses
  })
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/x-midi-chord', JSON.stringify({
    label: selectedChord.value.chordName,
    midis: selectedChord.value.midis,
    pitchClasses: selectedChord.value.pitchClasses
  }))
  event.dataTransfer.setData('text/plain', selectedChord.value.chordName)
}

async function audition() {
  if (!selectedChord.value?.midis.length) return
  await ensureAudioReady()
  const token = store.beginPlaying(selectedChord.value.midis, 'chord-palette')
  playChord(selectedChord.value.midis, 1.15, 0.09)
  window.setTimeout(() => store.endPlaying(token), 1150)
}
</script>

<style scoped>
.chord-palette {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(220px, auto) auto;
  gap: 9px;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,.12);
}
.chord-select { min-width: 0; }
.chord-drag-button { min-height: 46px; border: 1px solid rgba(255,216,102,.64); }
.chord-drag-button :deep(.q-btn__content) { gap: 8px; }
.chord-name { font-size: 19px; font-weight: 700; }
.chord-notes { font-size: 14px; opacity: .88; }
.category-copy { color: #aaa; font-size: 12px; }
.advanced-toggle { white-space: nowrap; }
@media (max-width: 760px) {
  .chord-palette { grid-template-columns: 1fr auto; }
  .chord-select { grid-column: 1 / -1; }
  .chord-notes { display: none; }
}
</style>
