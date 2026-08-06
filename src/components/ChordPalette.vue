<template>
  <div class="chord-palette">
    <q-select
      v-model="selectedId"
      :options="menuOptions"
      option-label="displayLabel"
      option-value="id"
      :option-disable="option => option.separator === true"
      emit-value
      map-options
      dark
      dense
      outlined
      options-dense
      hide-bottom-space
      aria-label="Choose a chord"
      popup-content-class="chord-options-menu"
      class="chord-select"
    >
      <template #option="scope">
        <q-item v-if="scope.opt.separator" class="chord-menu-separator" dense disable>
          <q-item-section><q-separator dark /></q-item-section>
        </q-item>
        <q-item
          v-else
          v-bind="scope.itemProps"
          :class="['chord-option-row', scope.index % 2 ? 'chord-row-odd' : 'chord-row-even']"
        >
          <q-item-section>
            <q-item-label class="chord-option-line">
              <span class="chord-option-name">{{ scope.opt.label }}</span>
              <span class="chord-option-notes">{{ scope.opt.notes.join('–') }}</span>
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
      <q-tooltip v-if="store.tooltipsEnabled">Choose a key-aware chord. A plain separator divides the diatonic and extended choices.</q-tooltip>
    </q-select>

    <q-btn
      v-if="selectedChord"
      no-caps
      outline
      color="grey-5"
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
      <q-tooltip v-if="store.tooltipsEnabled">Click to hear it. Drag it onto the staff to place the complete voicing.</q-tooltip>
    </q-btn>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ensureAudioReady, playChord } from '../music/audio'
import { buildChordPalette } from '../music/chords'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const selectedId = ref('seventh-4')

const palette = computed(() => buildChordPalette(store.currentKey, store.currentMode, store.accidentalMode))
const menuOptions = computed(() => {
  const basic = palette.value.filter((option) => option.category !== 'Color and advanced')
  const advanced = palette.value.filter((option) => option.category === 'Color and advanced')
  const mapOption = (option) => ({ ...option, displayLabel: `${option.label} · ${option.notes.join('–')}` })
  return [
    ...basic.map(mapOption),
    { id: '__advanced_separator__', separator: true, displayLabel: '', disable: true },
    ...advanced.map(mapOption)
  ]
})
const selectedChord = computed(() => palette.value.find((option) => option.id === selectedId.value) || palette.value[0] || null)

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
  grid-template-columns: minmax(280px, 1fr) minmax(210px, auto);
  gap: 9px;
  align-items: center;
  margin-top: 8px;
  padding-top: 0;
  border-top: 0;
}
.chord-select { min-width: 0; }
.chord-select :deep(.q-field__native),
.chord-select :deep(.q-field__input) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chord-drag-button { min-height: 44px; border-color: #777 !important; background: #333; }
.chord-drag-button :deep(.q-btn__content) { gap: 8px; min-width: 0; }
.chord-name { font-size: 18px; font-weight: 700; }
.chord-notes { font-size: 14px; opacity: .86; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 760px) {
  .chord-palette { grid-template-columns: 1fr; }
  .chord-notes { display: none; }
}
</style>
