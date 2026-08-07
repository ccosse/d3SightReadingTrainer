<template>
  <div class="chord-palette" :class="{ compact: props.compact }">
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
      square
      outline
      color="grey-5"
      text-color="white"
      icon="drag_indicator"
      class="chord-drag-button"
      draggable="true"
      :aria-label="`Drag ${selectedChord.chordName} to the staff`"
      @dragstart="startChordDrag"
      @dragend="store.clearStaffDragPayload"
      @click="audition"
    >
      <q-tooltip v-if="store.tooltipsEnabled">
        {{ selectedChord.chordName }} · {{ selectedChord.notes.join('–') }}. Click to hear it; drag onto the staff to place it.
      </q-tooltip>
    </q-btn>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ensureAudioReady, playChord } from '../music/audio'
import { buildChordPalette } from '../music/chords'
import { useNoteMapStore } from '../stores/noteMap'

const props = defineProps({ compact: { type: Boolean, default: false } })

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
  grid-template-columns: minmax(220px, 1fr) 46px;
  gap: 8px;
  align-items: center;
  justify-content: start;
  width: 100%;
  min-width: 0;
  padding-top: 0;
  border-top: 0;
}
.chord-select { width: 100%; min-width: 0; }
.chord-select :deep(.q-field__control) { min-height: 46px; height: 46px; border-radius: 4px; background: #292929; }
.chord-select :deep(.q-field__control::before) { border: 1px solid #676767 !important; }
.chord-select :deep(.q-field__control::after) { border: 1px solid #bdbdbd !important; }
.chord-select :deep(.q-field__native),
.chord-select :deep(.q-field__input) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chord-drag-button { width: 46px; min-width: 46px; height: 46px; min-height: 46px; padding: 0; border-color: #777 !important; border-radius: 4px; background: #333; }
.chord-drag-button :deep(.q-icon) { font-size: 24px; }
.chord-palette.compact { grid-template-columns: minmax(0, 1fr) 40px; gap: 6px; }
.chord-palette.compact .chord-drag-button { width: 40px; min-width: 40px; height: 40px; min-height: 40px; }
.chord-palette.compact .chord-select :deep(.q-field__control) { min-height: 40px; height: 40px; }
@media (max-width: 520px) {
  .chord-palette { grid-template-columns: minmax(0, 1fr) 42px; width: 100%; }
  .chord-drag-button { width: 42px; min-width: 42px; height: 42px; min-height: 42px; }
}

</style>
