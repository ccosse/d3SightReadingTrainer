<template>
  <div class="sidebar-settings staff-settings" aria-label="Staff and generation controls">
    <div class="dial-grid">
      <q-knob
        :model-value="store.srtTempo"
        :min="30"
        :max="220"
        :step="1"
        size="76px"
        :thickness="0.16"
        color="positive"
        track-color="grey-8"
        show-value
        @update:model-value="store.setSrtTempo"
      >
        <div class="dial-value"><strong>{{ store.srtTempo }}</strong><span>BPM</span></div>
        <q-tooltip v-if="store.tooltipsEnabled">Tempo. Changing it does not move the tape position.</q-tooltip>
      </q-knob>

      <q-knob
        :model-value="visibleBars"
        :min="1"
        :max="6"
        :step="1"
        size="76px"
        :thickness="0.16"
        color="positive"
        track-color="grey-8"
        show-value
        @update:model-value="store.setStaffVisibleBars(Number($event))"
      >
        <div class="dial-value"><strong>{{ visibleBars }}</strong><span>Bars</span></div>
        <q-tooltip v-if="store.tooltipsEnabled">Turn right to see more measures without shrinking the notation symbols.</q-tooltip>
      </q-knob>

      <q-knob
        :model-value="Math.round(store.srtGate * 100)"
        :min="25"
        :max="140"
        :step="5"
        size="76px"
        :thickness="0.16"
        color="positive"
        track-color="grey-8"
        show-value
        @update:model-value="store.setSrtGate(Number($event) / 100)"
      >
        <div class="dial-value"><strong>{{ Math.round(store.srtGate * 100) }}%</strong><span>Hold</span></div>
        <q-tooltip v-if="store.tooltipsEnabled">Gate length applied to every sounding note.</q-tooltip>
      </q-knob>

      <q-knob
        :model-value="Math.round(store.srtSwing * 100)"
        :min="0"
        :max="45"
        :step="5"
        size="76px"
        :thickness="0.16"
        color="positive"
        track-color="grey-8"
        show-value
        @update:model-value="store.setSrtSwing(Number($event) / 100)"
      >
        <div class="dial-value"><strong>{{ Math.round(store.srtSwing * 100) }}%</strong><span>Swing</span></div>
        <q-tooltip v-if="store.tooltipsEnabled">Delay alternating pulses for a long-short feel.</q-tooltip>
      </q-knob>
    </div>

    <div class="select-list">
      <q-select dense dark outlined emit-value map-options label="Source" :model-value="store.srtSource" :options="options.source" @update:model-value="setOption('srtSource', $event)" />
      <q-select dense dark outlined emit-value map-options label="Sound" :model-value="store.audioEngine" :options="AUDIO_ENGINE_OPTIONS" @update:model-value="store.setAudioEngine" />
      <q-select v-if="['soundfont', 'web-midi'].includes(store.audioEngine)" dense dark outlined emit-value map-options label="Instrument" :model-value="store.audioProgram" :options="GM_PROGRAM_OPTIONS" @update:model-value="store.setAudioProgram" />
      <q-select v-if="store.audioEngine === 'web-midi'" dense dark outlined emit-value map-options label="MIDI out" :model-value="store.midiOutputId" :options="store.midiOutputs" :display-value="store.midiOutputs.find((item) => item.value === store.midiOutputId)?.label || 'Choose output'" @popup-show="store.refreshMidiOutputs" @update:model-value="store.setMidiOutputId" />
      <q-select v-if="store.audioEngine === 'web-midi'" dense dark outlined emit-value map-options label="Channel" :model-value="store.midiChannel" :options="MIDI_CHANNEL_OPTIONS" @update:model-value="store.setMidiChannelValue" />
      <q-btn v-if="store.audioEngine === 'web-midi'" flat dense icon="refresh" label="MIDI outputs" color="grey-3" @click="store.refreshMidiOutputs"><q-tooltip v-if="store.tooltipsEnabled">Request MIDI permission and refresh connected outputs.</q-tooltip></q-btn>
      <q-select dense dark outlined emit-value map-options label="Style" :model-value="store.srtStyle" :options="options.style" :disable="store.srtSource === 'staff'" @update:model-value="setOption('srtStyle', $event)" />
      <q-select v-if="store.srtStyle === 'free'" dense dark outlined emit-value map-options label="Material" :model-value="store.srtMaterial" :options="options.material" :disable="store.srtSource === 'staff'" @update:model-value="setOption('srtMaterial', $event)" />
      <q-select v-if="store.srtStyle === 'free'" dense dark outlined emit-value map-options label="Logic" :model-value="store.srtMotion" :options="options.motion" :disable="store.srtSource === 'staff'" @update:model-value="setOption('srtMotion', $event)" />
      <q-select v-if="accompanimentStyle" dense dark outlined multiple emit-value map-options label="Left hand" :model-value="store.srtLeftHandSizes" :options="options.chordSize" :display-value="leftHandSizeSummary" @update:model-value="store.setSrtHandSizes('left', $event)" >
        <template #option="scope">
          <q-item v-bind="scope.itemProps" dense>
            <q-item-section>{{ scope.opt.label }}</q-item-section>
            <q-item-section side><q-icon :name="scope.selected ? 'check_box' : 'check_box_outline_blank'" :color="scope.selected ? 'positive' : 'grey-6'" /></q-item-section>
          </q-item>
        </template>
        <q-tooltip v-if="store.tooltipsEnabled">Allowed bass/left-hand group sizes. The generator chooses among the checked items.</q-tooltip>
      </q-select>
      <q-select v-if="accompanimentStyle" dense dark outlined multiple emit-value map-options label="Right hand" :model-value="store.srtRightHandSizes" :options="options.chordSize" :display-value="rightHandSizeSummary" @update:model-value="store.setSrtHandSizes('right', $event)" >
        <template #option="scope">
          <q-item v-bind="scope.itemProps" dense>
            <q-item-section>{{ scope.opt.label }}</q-item-section>
            <q-item-section side><q-icon :name="scope.selected ? 'check_box' : 'check_box_outline_blank'" :color="scope.selected ? 'positive' : 'grey-6'" /></q-item-section>
          </q-item>
        </template>
        <q-tooltip v-if="store.tooltipsEnabled">Allowed treble/right-hand group sizes. The generator chooses among the checked items independently of the left hand.</q-tooltip>
      </q-select>
      <q-select v-if="store.srtStyle === 'walking-chords'" dense dark outlined emit-value map-options label="Bass" :model-value="store.srtBassPattern" :options="options.bassPattern" @update:model-value="setOption('srtBassPattern', $event)" />
      <q-select v-if="store.srtStyle === 'strato'" dense dark outlined emit-value map-options label="Exercise" :model-value="store.srtExerciseMode" :options="options.exerciseMode" @update:model-value="setOption('srtExerciseMode', $event)" />
      <div v-if="store.srtStyle === 'strato'" class="strato-guide"><q-icon name="sports_score" size="16px" /><span>{{ exerciseGuide }}</span></div>
      <q-select dense dark outlined emit-value map-options label="Clefs" :model-value="store.srtClefMode" :options="options.clefMode" :disable="store.srtSource === 'staff' || store.srtStyle !== 'free'" @update:model-value="setOption('srtClefMode', $event)" />
      <q-select dense dark outlined emit-value map-options label="Range" :model-value="store.srtRange" :options="options.range" :disable="store.srtSource === 'staff'" @update:model-value="setOption('srtRange', $event)" />
      <q-select dense dark outlined emit-value map-options label="New event" :model-value="store.srtEventSpacing" :options="options.spacing" :disable="store.srtSource === 'staff' || accompanimentStyle" @update:model-value="store.setSrtEventSpacing" />
      <q-select dense dark outlined emit-value map-options label="Progression" :model-value="store.srtProgression" :options="options.progression" :disable="store.srtSource === 'staff'" @update:model-value="setOption('srtProgression', $event)" />
      <q-select v-if="store.srtStyle === 'riff'" dense dark outlined emit-value map-options label="Riff flavor" :model-value="store.srtRiffFlavor" :options="options.riffFlavor" @update:model-value="setOption('srtRiffFlavor', $event)" />
      <q-select dense dark outlined emit-value map-options label="Dynamics" :model-value="store.srtDynamics" :options="options.dynamics" :disable="store.srtSource === 'staff'" @update:model-value="setOption('srtDynamics', $event)" />
    </div>

    <div v-if="store.srtSource === 'generated'" class="region-controls">
      <div class="region-row">
        <div class="region-caption">Treble</div>
        <ImageCheckbox class="compact-toggle" :model-value="regionEnabled('treble', 'low')" label="Low" tooltip="Allow generated treble notes from C3 through C4." @update:model-value="setRegion('treble', 'low', $event)" />
        <ImageCheckbox class="compact-toggle" :model-value="regionEnabled('treble', 'mid')" label="Mid" tooltip="Allow generated treble notes from middle C (C4) through C5." @update:model-value="setRegion('treble', 'mid', $event)" />
        <ImageCheckbox class="compact-toggle" :model-value="regionEnabled('treble', 'high')" label="High" tooltip="Allow generated treble notes from C5 through C6." @update:model-value="setRegion('treble', 'high', $event)" />
      </div>
      <div class="region-row">
        <div class="region-caption">Bass</div>
        <ImageCheckbox class="compact-toggle" :model-value="regionEnabled('bass', 'low')" label="Low" tooltip="Allow generated bass notes from C1 through C2." @update:model-value="setRegion('bass', 'low', $event)" />
        <ImageCheckbox class="compact-toggle" :model-value="regionEnabled('bass', 'mid')" label="Mid" tooltip="Allow generated bass notes from C2 through C3." @update:model-value="setRegion('bass', 'mid', $event)" />
        <ImageCheckbox class="compact-toggle" :model-value="regionEnabled('bass', 'high')" label="High" tooltip="Allow generated bass notes from C3 through middle C (C4)." @update:model-value="setRegion('bass', 'high', $event)" />
      </div>
    </div>

    <div class="staff-audio-grid">
      <ImageCheckbox class="compact-toggle" :model-value="store.srtTrebleAudio" label="Treble audio" tooltip="Mute or unmute treble-staff playback without changing the notation." @update:model-value="store.setSrtStaffAudio('treble', $event)" />
      <ImageCheckbox class="compact-toggle" :model-value="store.srtBassAudio" label="Bass audio" tooltip="Mute or unmute bass-staff playback without changing the notation." @update:model-value="store.setSrtStaffAudio('bass', $event)" />
    </div>

    <div class="toggle-list">
      <ImageCheckbox class="compact-toggle" :model-value="store.audioSustain" label="Pedal" tooltip="Add a longer release tail internally, or send MIDI sustain CC64 to the selected output." @update:model-value="store.setAudioSustain" />
      <ImageCheckbox class="compact-toggle" v-model="store.srtShowLabels" label="Labels" tooltip="Show or hide note-name labels on the staff." />
      <ImageCheckbox class="compact-toggle" v-if="store.srtSource === 'staff'" v-model="store.srtLoopManual" label="Loop" tooltip="Loop the manual staff sequence." />
    </div>

    <div class="staff-action-row">
      <q-btn flat dense color="grey-3" :icon="store.srtSource === 'staff' ? 'delete_sweep' : 'refresh'" :label="store.srtSource === 'staff' ? 'Clear staff' : 'Reseed'" @click="resetOrReseed">
        <q-tooltip v-if="store.tooltipsEnabled">{{ store.srtSource === 'staff' ? 'Clear the manual staff and reset its tape.' : 'Regenerate the endless passage from the beginning.' }}</q-tooltip>
      </q-btn>
      <q-btn v-if="store.clipSelectionStart !== null" flat dense round color="grey-3" icon="deselect" aria-label="Clear staff selection" @click="store.clearClipSelection">
        <q-tooltip v-if="store.tooltipsEnabled">Clear the selected staff region.</q-tooltip>
      </q-btn>
    </div>

    <div v-if="store.clips.length" class="clip-library">
      <div
        v-for="clip in store.clips"
        :key="clip.id"
        class="clip-row"
        draggable="true"
        @dragstart="startClipDrag($event, clip)"
        @dragend="store.clearStaffDragPayload"
      >
        <q-icon name="drag_indicator" size="18px" class="clip-drag-icon" />
        <button type="button" class="clip-name" @click="store.loadClipToStaff(clip.id)">{{ clip.name }}</button>
        <q-btn flat dense round size="sm" color="grey-4" icon="edit" @click="openRenameDialog(clip)"><q-tooltip v-if="store.tooltipsEnabled">Rename this clip.</q-tooltip></q-btn>
        <q-btn flat dense round size="sm" color="grey-4" icon="delete" @click="store.removeClip(clip.id)"><q-tooltip v-if="store.tooltipsEnabled">Delete this saved clip.</q-tooltip></q-btn>
        <q-tooltip v-if="store.tooltipsEnabled">Click the name to load it, or drag the clip onto the staff to insert it at that time position.</q-tooltip>
      </div>
    </div>

    <q-dialog v-model="renameDialogOpen">
      <q-card class="rename-card text-white">
        <q-card-section class="text-subtitle1">Rename clip</q-card-section>
        <q-card-section>
          <q-input v-model="renameValue" dark outlined autofocus label="Clip name" @keyup.enter="commitRename" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey-4" v-close-popup />
          <q-btn flat label="Save" color="positive" :disable="!renameValue.trim()" @click="commitRename" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { AUDIO_ENGINE_OPTIONS, GM_PROGRAM_OPTIONS, MIDI_CHANNEL_OPTIONS } from '../music/audio'
import { SIGHT_READING_OPTIONS } from '../music/generator'
import ImageCheckbox from './ImageCheckbox.vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const renameDialogOpen = ref(false)
const renameValue = ref('')
const renameClipId = ref(null)
const options = SIGHT_READING_OPTIONS
const accompanimentStyle = computed(() => ['walking-chords', 'stride', 'boogie', 'riff', 'jazz-guitar'].includes(store.srtStyle))
const visibleBars = computed(() => Math.max(1, Math.min(6, Math.round(store.staffVisibleBeats / 4))))
const handSizeNames = { single: '1', dyad: '2', triad: '3', seventh: '7', ninth: '9', thirteenth: '13' }
const leftHandSizeSummary = computed(() => `LH · ${store.srtLeftHandSizes.map((value) => handSizeNames[value] || value).join(', ')}`)
const rightHandSizeSummary = computed(() => `RH · ${store.srtRightHandSizes.map((value) => handSizeNames[value] || value).join(', ')}`)
const exerciseGuide = computed(() => ({
  'mode-1': 'Locate each random target.',
  'mode-2': 'Follow adjacent scale motion.',
  'mode-3': 'Identify each interval pair.',
  'mode-4': 'Identify each chord-tone set.'
}[store.srtExerciseMode] || 'Play each target at the scanline.'))

function regionEnabled(clef, region) {
  return (clef === 'bass' ? store.srtBassRegions : store.srtTrebleRegions).includes(region)
}

function setRegion(clef, region, enabled) {
  store.setSrtRegion(clef, region, enabled)
}

function setOption(name, value) {
  if (name === 'srtStyle' && value === 'strato') {
    store.srtSource = 'generated'
    store.srtEventSpacing = 1
    store.srtClefMode = 'treble'
  }
  store.setSrtOption(name, value)
}

function startClipDrag(event, clip) {
  const payload = {
    type: 'clip',
    label: clip.name,
    events: (clip.events || []).map((item) => ({
      beat: Number(item.beat) || 0,
      duration: Math.max(0.25, Number(item.duration) || 1),
      midis: [...new Set((item.midis || []).map(Number).filter(Number.isFinite))]
    }))
  }
  store.setStaffDragPayload(payload)
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/x-d3srt-clip', JSON.stringify(payload))
  event.dataTransfer.setData('text/plain', clip.name)
}

function openRenameDialog(clip) {
  renameClipId.value = clip.id
  renameValue.value = clip.name
  renameDialogOpen.value = true
}

function commitRename() {
  const name = renameValue.value.trim()
  if (!renameClipId.value || !name) return
  store.renameClip(renameClipId.value, name)
  renameDialogOpen.value = false
  renameClipId.value = null
  renameValue.value = ''
}

function resetOrReseed() {
  store.requestSrtStop()
  if (store.srtSource === 'staff') {
    store.clearStaffSequence()
    store.clearClipSelection()
  }
  store.srtGenerationNonce += 1
}
</script>

<style scoped>
.sidebar-settings { display: grid; gap: 9px; }
.dial-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; place-items: center; }
.dial-value { display: grid; place-items: center; line-height: 1.02; font-variant-numeric: tabular-nums; }
.dial-value strong { font-size: 13px; }
.dial-value span { margin-top: 2px; color: #cfcfcf; font-size: 9px; text-transform: uppercase; letter-spacing: .05em; }
.select-list { display: grid; gap: 5px; }
.select-list :deep(.q-field__control) { min-height: 40px; background: #292929; }
.select-list :deep(.q-field__label), .select-list :deep(.q-field__native), .select-list :deep(.q-field__input) { font-size: 14px; }
.region-controls { display: grid; gap: 5px; padding: 2px 0; }
.region-row { display: grid; grid-template-columns: 56px repeat(3, minmax(0, 1fr)); align-items: center; gap: 5px; }
.region-caption { color: #aaa; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; text-align: right; }
.region-row :deep(.image-checkbox.compact-toggle),
.staff-audio-grid :deep(.image-checkbox.compact-toggle),
.toggle-list :deep(.image-checkbox.compact-toggle) {
  width: max-content;
  min-height: 23px;
  grid-template-columns: auto 18px;
  gap: 5px;
  justify-self: center;
}
.region-row :deep(.checkbox-image),
.staff-audio-grid :deep(.checkbox-image),
.toggle-list :deep(.checkbox-image) { width: 18px; height: 18px; }
.region-row :deep(.image-checkbox-label) { font-size: 12px; }
.staff-audio-grid { display: grid; grid-template-columns: 1fr; justify-items: center; align-items: center; gap: 3px; padding-top: 1px; }
.staff-audio-grid :deep(.image-checkbox.compact-toggle) { min-width: 132px; justify-self: center; }
.staff-audio-grid :deep(.image-checkbox-label) { font-size: 13px; }
.toggle-list { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 3px 18px; }
.toggle-list :deep(.image-checkbox-label) { font-size: 13px; }
.strato-guide { display: flex; align-items: flex-start; gap: 6px; color: #d6d6d6; font-size: 13px; line-height: 1.3; }
.staff-action-row { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
.clip-library { display: grid; gap: 4px; padding-top: 3px; }
.clip-row { display: grid; grid-template-columns: 22px minmax(0,1fr) 28px 28px; align-items: center; gap: 3px; min-height: 34px; }
.clip-drag-icon { color: #aaa; cursor: grab; }
.clip-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border: 0; padding: 0; color: #eee; background: transparent; text-align: left; font: inherit; font-size: 13px; cursor: pointer; }
.rename-card { width: min(420px, calc(100vw - 32px)); background: #292929; }
</style>
