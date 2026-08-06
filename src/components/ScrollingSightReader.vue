<template>
  <section class="srt-shell">
    <div class="srt-config-header">
      <div>
        <span>{{ sourceSummary }}</span>
      </div>
      <q-btn
        flat
        dense
        round
        :icon="store.srtConfigOpen ? 'expand_less' : 'tune'"
        :aria-label="store.srtConfigOpen ? 'Collapse generation controls' : 'Open generation controls'"
        @click="store.srtConfigOpen = !store.srtConfigOpen"
      >
        <q-tooltip v-if="store.tooltipsEnabled">{{ store.srtConfigOpen ? 'Collapse configuration and leave the player visible.' : 'Open generation and composition controls.' }}</q-tooltip>
      </q-btn>
    </div>

    <q-slide-transition>
      <div v-show="store.srtConfigOpen" class="srt-controls">
        <div class="srt-select-row">
          <q-select dense dark outlined emit-value map-options label="Source" :model-value="store.srtSource" :options="options.source" @update:model-value="setOption('srtSource', $event)" />
          <q-select dense dark outlined emit-value map-options label="Style" :model-value="store.srtStyle" :options="options.style" :disable="store.srtSource === 'staff'" @update:model-value="setOption('srtStyle', $event)" />

          <q-select
            v-if="store.srtStyle === 'free'"
            dense dark outlined emit-value map-options label="Material"
            :model-value="store.srtMaterial" :options="options.material"
            :disable="store.srtSource === 'staff'" @update:model-value="setOption('srtMaterial', $event)"
          />
          <q-select
            v-if="store.srtStyle === 'free'"
            dense dark outlined emit-value map-options label="Logic"
            :model-value="store.srtMotion" :options="options.motion"
            :disable="store.srtSource === 'staff'" @update:model-value="setOption('srtMotion', $event)"
          />
          <q-select
            v-if="['walking-chords', 'stride', 'boogie', 'riff', 'jazz-guitar'].includes(store.srtStyle)"
            dense dark outlined emit-value map-options label="Chords"
            :model-value="store.srtChordSize" :options="options.chordSize"
            @update:model-value="setOption('srtChordSize', $event)"
          />
          <q-select
            v-if="store.srtStyle === 'walking-chords'"
            dense dark outlined emit-value map-options label="Bass"
            :model-value="store.srtBassPattern" :options="options.bassPattern"
            @update:model-value="setOption('srtBassPattern', $event)"
          />
          <q-select
            v-if="store.srtStyle === 'strato'"
            dense dark outlined emit-value map-options label="Exercise"
            :model-value="store.srtExerciseMode" :options="options.exerciseMode"
            @update:model-value="setOption('srtExerciseMode', $event)"
          />

          <q-select dense dark outlined emit-value map-options label="Clefs" :model-value="store.srtClefMode" :options="options.clefMode" :disable="store.srtSource === 'staff' || store.srtStyle !== 'free'" @update:model-value="setOption('srtClefMode', $event)" />
          <q-select dense dark outlined emit-value map-options label="Range" :model-value="store.srtRange" :options="options.range" :disable="store.srtSource === 'staff'" @update:model-value="setOption('srtRange', $event)" />
          <q-select dense dark outlined emit-value map-options label="New event" :model-value="store.srtEventSpacing" :options="options.spacing" :disable="store.srtSource === 'staff' || accompanimentStyle" @update:model-value="store.setSrtEventSpacing" />
          <q-select dense dark outlined emit-value map-options label="Progression" :model-value="store.srtProgression" :options="options.progression" :disable="store.srtSource === 'staff'" @update:model-value="setOption('srtProgression', $event)" />
          <q-select v-if="store.srtStyle === 'riff'" dense dark outlined emit-value map-options label="Riff flavor" :model-value="store.srtRiffFlavor" :options="options.riffFlavor" @update:model-value="setOption('srtRiffFlavor', $event)" />
          <q-select dense dark outlined emit-value map-options label="Dynamics" :model-value="store.srtDynamics" :options="options.dynamics" :disable="store.srtSource === 'staff'" @update:model-value="setOption('srtDynamics', $event)" />
        </div>

        <div v-if="store.srtStyle === 'strato'" class="strato-guide">
          <q-icon name="sports_score" size="18px" />
          <span>{{ exerciseGuide }}</span>
          <q-tooltip v-if="store.tooltipsEnabled">Read or play each target as it reaches the fixed scanline. Labels can be enabled temporarily as a check.</q-tooltip>
        </div>

        <div class="srt-dial-row">
          <q-knob
            :model-value="Math.round(store.srtGate * 100)"
            :min="25"
            :max="140"
            :step="5"
            size="72px"
            :thickness="0.16"
            color="grey-4"
            track-color="grey-8"
            show-value
            @update:model-value="store.setSrtGate(Number($event) / 100)"
          >
            <div class="dial-value"><strong>{{ Math.round(store.srtGate * 100) }}%</strong><span>Hold</span></div>
            <q-tooltip v-if="store.tooltipsEnabled">Gate length for every note in the event, bass and treble alike.</q-tooltip>
          </q-knob>

          <q-knob
            :model-value="Math.round(store.srtSwing * 100)"
            :min="0"
            :max="45"
            :step="5"
            size="72px"
            :thickness="0.16"
            color="grey-4"
            track-color="grey-8"
            show-value
            @update:model-value="store.setSrtSwing(Number($event) / 100)"
          >
            <div class="dial-value"><strong>{{ Math.round(store.srtSwing * 100) }}%</strong><span>Swing</span></div>
            <q-tooltip v-if="store.tooltipsEnabled">Delays alternating pulses to create a long-short feel.</q-tooltip>
          </q-knob>

          <div class="srt-action-row">
            <ImageCheckbox v-model="store.srtShowLabels" label="Labels" tooltip="Show or hide note-name labels on the staff." />
            <ImageCheckbox v-if="store.srtSource === 'staff'" v-model="store.srtLoopManual" label="Loop" tooltip="Loop the manual staff sequence." />
            <q-btn
              flat
              :icon="store.srtSource === 'staff' ? 'delete_sweep' : 'refresh'"
              color="grey-3"
              @click="resetOrReseed"
            >
              <q-tooltip v-if="store.tooltipsEnabled">
                {{ store.srtSource === 'staff'
                  ? 'Clear the manual staff and return its tape to the beginning.'
                  : 'Reseed and regenerate the endless passage from the beginning.' }}
              </q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
    </q-slide-transition>

    <div class="scroll-stage">
      <svg
        ref="readerSvg"
        class="scroll-svg"
        viewBox="0 0 1120 360"
        role="img"
        aria-label="Common scrolling grand staff with fixed scanline, clip selection, and linked instrument playback"
        @dragenter.stop.prevent="updateDropPreview"
        @dragover.stop.prevent="updateDropPreview"
        @dragleave.stop="clearDropPreview"
        @drop.stop.prevent="dropPitch"
        @dblclick.stop="addSelectedAtPointer"
        @pointerdown="beginRangeSelection"
        @pointermove="updateRangeSelection"
        @pointerup="finishRangeSelection"
        @pointercancel="cancelRangeSelection"
        @pointerleave="finishRangeSelection"
      >
        <rect x="0" y="0" width="1120" height="360" class="stage-bg" />
        <defs>
          <clipPath id="moving-note-clip">
            <rect x="176" y="40" width="916" height="278" />
          </clipPath>
        </defs>

        <g class="moving-grid">
          <g v-for="marker in timelineMarkers" :key="marker.key">
            <line :x1="marker.x" :x2="marker.x" y1="44" y2="314" :class="marker.isBar ? 'bar-line' : 'beat-line'" />
            <text v-if="marker.isBar" :x="marker.x + 6" y="31" class="measure-label">{{ marker.measure }}</text>
          </g>
        </g>

        <g v-for="y in staffLines" :key="y"><line x1="28" :y1="y" x2="1092" :y2="y" class="staff-line" /></g>
        <line x1="28" y1="181" x2="1092" y2="181" class="middle-c-guide" />
        <text x="38" y="150" class="treble-clef">𝄞</text>
        <text x="42" y="292" class="bass-clef">𝄢</text>
        <g v-for="symbol in signatureSymbols" :key="`${symbol.clef}-${symbol.index}`"><text :x="symbol.x" :y="symbol.y" class="signature-symbol">{{ symbol.char }}</text></g>

        <g v-if="!hasPlayableSource" class="empty-state">
          <text x="560" y="165" text-anchor="middle">The manual staff is empty.</text>
          <text x="560" y="194" text-anchor="middle" class="empty-sub">Add notes on Note Map, or switch Source to Generated.</text>
        </g>

        <g clip-path="url(#moving-note-clip)">
          <path v-for="tie in visibleTies" :key="tie.key" :d="tie.path" class="note-tie" />
          <g v-for="event in visibleEvents" :key="event.id" class="scroll-event" :class="{ crossing: event.crossing }">
            <text v-if="event.isRest" :x="event.x" :y="event.restY" text-anchor="middle" class="rest-symbol">{{ event.restGlyph }}</text>
            <line v-for="(stem, stemIndex) in event.stems" :key="`${event.id}-stem-${stemIndex}`" :x1="stem.x" :x2="stem.x" :y1="stem.y1" :y2="stem.y2" class="note-stem" />
            <g v-for="note in event.notes" :key="`${event.id}-${note.midi}`">
              <line v-for="ledgerY in note.ledgerLines" :key="ledgerY" :x1="note.x - 16" :x2="note.x + 16" :y1="ledgerY" :y2="ledgerY" class="ledger-line" />
              <text v-if="note.accidental" :x="note.x - 19" :y="note.y + 7" text-anchor="middle" class="note-accidental">{{ note.accidental }}</text>
              <ellipse :cx="note.x" :cy="note.y" rx="10" ry="7" :transform="`rotate(-18 ${note.x} ${note.y})`" class="scroll-head" />
              <text v-if="store.srtShowLabels" :x="note.labelX" :y="note.labelY" :text-anchor="note.labelAnchor" class="scroll-label">{{ note.label }}</text>
            </g>
          </g>
        </g>

        <g v-if="dropPreview" class="drop-preview" pointer-events="none">
          <rect v-if="dropPreview.width" :x="dropPreview.x" y="45" :width="dropPreview.width" height="269" class="clip-drop-span" />
          <line :x1="dropPreview.x" :x2="dropPreview.x" y1="45" y2="314" class="drop-guide" />
          <g v-for="note in dropPreview.notes" :key="`preview-${note.midi}`">
            <line v-for="ledgerY in note.ledgerLines" :key="ledgerY" :x1="note.x - 16" :x2="note.x + 16" :y1="ledgerY" :y2="ledgerY" class="preview-ledger" />
            <text v-if="note.accidental" :x="note.x - 19" :y="note.y + 7" text-anchor="middle" class="preview-accidental">{{ note.accidental }}</text>
            <ellipse :cx="note.x" :cy="note.y" rx="10" ry="7" :transform="`rotate(-18 ${note.x} ${note.y})`" class="preview-head" />
          </g>
          <text :x="dropPreview.x + 14" y="56" class="preview-label">{{ dropPreview.label }} · beat {{ dropPreview.beatLabel }}</text>
        </g>

        <rect v-if="selectionVisual" :x="selectionVisual.x" y="42" :width="selectionVisual.width" height="274" class="clip-selection" />
        <line :x1="scanX" :x2="scanX" y1="34" y2="318" class="fixed-scanline" />
        <polygon :points="`${scanX - 7},34 ${scanX + 7},34 ${scanX},46`" class="scan-marker" />
      </svg>
    </div>

    <div class="clip-toolbar">
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
        @update:model-value="setVisibleBars"
      >
        <div class="dial-value"><strong>{{ visibleBars }}</strong><span>Bars</span></div>
        <q-tooltip v-if="store.tooltipsEnabled">Turn right for more visible bars.</q-tooltip>
      </q-knob>
      <q-input v-model="clipName" dark outlined dense label="Clip name" />
      <q-btn outline color="grey-5" icon="content_cut" label="Save selected region" no-caps :disable="!canSaveSelection" @click="saveSelection" />
      <q-btn outline color="grey-5" icon="playlist_add" label="Next 2 bars → staff" no-caps :disable="store.srtSource !== 'generated' || !events.length" @click="captureToStaff" />
      <q-btn v-if="store.clipSelectionStart !== null" flat color="grey-4" icon="deselect" @click="store.clearClipSelection"><q-tooltip v-if="store.tooltipsEnabled">Clear the selected time region.</q-tooltip></q-btn>
    </div>

    <div v-if="store.clips.length" class="clip-library">
      <div class="clip-library-title">Clip library</div>
      <div
        v-for="clip in store.clips"
        :key="clip.id"
        class="clip-row"
        draggable="true"
        @dragstart="startClipDrag($event, clip)"
        @dragend="store.clearStaffDragPayload"
      >
        <q-icon name="drag_indicator" size="22px" class="clip-drag-icon" />
        <div><strong>{{ clip.name }}</strong><span>{{ clip.events.length }} events · {{ clip.tempo }} BPM</span></div>
        <q-btn flat color="grey-4" icon="edit_note" @click="store.loadClipToStaff(clip.id)"><q-tooltip v-if="store.tooltipsEnabled">Load this clip into the editable staff.</q-tooltip></q-btn>
        <q-btn flat color="grey-4" icon="delete" @click="store.removeClip(clip.id)"><q-tooltip v-if="store.tooltipsEnabled">Delete this saved clip.</q-tooltip></q-btn>
        <q-tooltip v-if="store.tooltipsEnabled">Drag the clip onto the staff to insert it at that time position.</q-tooltip>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ensureAudioReady, startChord, stopChordVoices } from '../music/audio'
import { SIGHT_READING_OPTIONS, SightReadingGenerator } from '../music/generator'
import { keyPitchClasses, midiOctave, mod12, noteName } from '../music/theory'
import ImageCheckbox from './ImageCheckbox.vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const options = SIGHT_READING_OPTIONS
const generator = new SightReadingGenerator()
const events = ref([])
const currentBeat = ref(0)
const readerSvg = ref(null)
const clipName = ref('')
const dropPreview = ref(null)
const scanX = 560
const pixelsPerBeat = computed(() => 126 * store.staffZoom)
const visibleBars = computed(() => Math.max(1, Math.min(6, Math.round((1120 / pixelsPerBeat.value) / 4))))
const exerciseGuide = computed(() => ({
  'mode-1': 'Mode 1 · locate one random target note at the scanline.',
  'mode-2': 'Mode 2 · follow adjacent scale motion without losing position.',
  'mode-3': 'Mode 3 · identify and play the displayed interval pair.',
  'mode-4': 'Mode 4 · identify and play the displayed chord tones.'
}[store.srtExerciseMode] || 'Play each target as it reaches the scanline.'))
const leadInBeats = 4
const horizonBeats = 28
const historyBeats = 64
const staffLines = [78, 92, 106, 120, 134, 228, 242, 256, 270, 284]
const letterOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
let animationFrame = 0
let startedAt = 0
let previousBeat = 0
let nextGeneratedBeat = leadInBeats
let nextManualCycleBeat = leadInBeats
let playedIds = new Set()
let releaseTimers = []
let activeVoiceGroups = []
let sessionToken = 0
let selecting = false
let selectionAnchor = null
let generatedPulseIndex = 0

const accompanimentStyle = computed(() => ['walking-chords', 'stride', 'boogie', 'riff', 'jazz-guitar'].includes(store.srtStyle))
const effectiveSpacing = computed(() => {
  if (['boogie', 'riff'].includes(store.srtStyle)) return 0.5
  return accompanimentStyle.value ? 1 : store.srtEventSpacing
})
const sourceSummary = computed(() => {
  if (store.srtSource === 'staff') return store.hasStaffSequence ? `manual staff · ${store.staffClusters.length} positions · ${store.srtLoopManual ? 'looping' : 'one pass'}` : 'manual staff · no notes yet'
  return `${labelFor(options.style, store.srtStyle)} · ${labelFor(options.range, store.srtRange)} · endless`
})
const hasPlayableSource = computed(() => store.srtSource === 'generated' || store.hasStaffSequence)
const canSaveSelection = computed(() => store.clipSelectionStart !== null && store.clipSelectionEnd !== null && selectedEvents.value.length > 0)
const selectedEvents = computed(() => {
  if (store.clipSelectionStart === null || store.clipSelectionEnd === null) return []
  return events.value.filter((event) => event.beat >= store.clipSelectionStart && event.beat <= store.clipSelectionEnd)
})
const selectionVisual = computed(() => {
  if (store.clipSelectionStart === null || store.clipSelectionEnd === null) return null
  const left = xForBeat(store.clipSelectionStart)
  const right = xForBeat(store.clipSelectionEnd)
  const x = Math.max(0, Math.min(left, right))
  const end = Math.min(1120, Math.max(left, right))
  return end > x ? { x, width: end - x } : null
})
const timelineMarkers = computed(() => {
  const halfSpan = 1120 / pixelsPerBeat.value / 2
  const first = Math.floor(currentBeat.value - halfSpan - 1)
  const last = Math.ceil(currentBeat.value + halfSpan + 1)
  const result = []
  for (let beat = Math.max(0, first); beat <= last; beat += 1) {
    const x = xForBeat(beat)
    if (x < -10 || x > 1130) continue
    const isBar = mod4(beat) === 0
    result.push({ key: `m-${beat}`, beat, x, isBar, measure: Math.floor(beat / 4) + 1 })
  }
  return result
})
const visualEvents = computed(() => events.value.map(buildVisualEvent))
const visibleEvents = computed(() => visualEvents.value.filter((event) => event.x > -90 && event.x < 1210))
const visibleTies = computed(() => {
  const result = []
  for (let index = 1; index < visualEvents.value.length; index += 1) {
    const current = visualEvents.value[index]
    if (!current.tieFromPrevious || current.isRest) continue
    const previous = visualEvents.value[index - 1]
    if (!previous || previous.isRest) continue
    for (const note of current.notes) {
      const prior = previous.notes.find((candidate) => candidate.midi === note.midi)
      if (!prior) continue
      const startX = prior.x + 11
      const endX = note.x - 11
      if (endX <= startX) continue
      const arch = note.y < 181 ? -18 : 18
      const controlX = (startX + endX) / 2
      const controlY = note.y + arch
      result.push({ key: `${previous.id}-${current.id}-${note.midi}`, path: `M ${startX} ${note.y} Q ${controlX} ${controlY} ${endX} ${note.y}` })
    }
  }
  return result.filter((tie) => !tie.path.includes('NaN'))
})
const signatureSymbols = computed(() => {
  const signature = store.currentKey.signature
  if (signature === 0) return []
  const count = Math.abs(signature)
  const char = signature > 0 ? '♯' : '♭'
  const treble = signature > 0 ? [85, 106, 78, 99, 120, 92, 113] : [113, 92, 120, 99, 127, 106, 134]
  const bass = signature > 0 ? [235, 256, 228, 249, 270, 242, 263] : [263, 242, 270, 249, 277, 256, 284]
  return Array.from({ length: count }, (_, index) => [
    { clef: 'treble', index, x: 93 + index * 17, y: treble[index], char },
    { clef: 'bass', index, x: 93 + index * 17, y: bass[index], char }
  ]).flat()
})

function labelFor(list, value) { return list.find((item) => item.value === value)?.label || value }
function mod4(value) { return ((value % 4) + 4) % 4 }
function setOption(name, value) {
  if (name === 'srtStyle' && value === 'strato') {
    store.srtSource = 'generated'
    store.srtEventSpacing = 1
    store.srtClefMode = 'treble'
  }
  store.setSrtOption(name, value)
}
function setVisibleBars(value) { store.setStaffVisibleBars(value) }
function accidentalSymbol(name) {
  if (String(name).includes('♯') || String(name).includes('#')) return '♯'
  if (String(name).includes('♭') || String(name).includes('b')) return '♭'
  return ''
}
function spellingForMidi(midi) {
  const pc = mod12(midi)
  const scalePcs = keyPitchClasses(store.currentKey, store.currentMode)
  const scaleIndex = scalePcs.indexOf(pc)
  if (scaleIndex >= 0) return store.activeScaleNames[scaleIndex]
  return noteName(pc, store.accidentalMode)
}
function keySignatureAccidentalForLetter(letter) {
  const scaleName = store.currentKey.scale.find((name) => String(name).startsWith(letter))
  return accidentalSymbol(scaleName || '')
}
function accidentalForMidi(midi) {
  const spelling = spellingForMidi(midi)
  const actual = accidentalSymbol(spelling)
  const expected = keySignatureAccidentalForLetter(String(spelling)[0])
  if (actual === expected) return ''
  if (!actual && expected) return '♮'
  return actual || '♮'
}
function displayLabelForMidi(midi) {
  return `${spellingForMidi(midi)}${midiOctave(midi)}`
}
function diatonicStepFromC4(midi) {
  const spelling = spellingForMidi(midi)
  const octave = midiOctave(midi)
  return (octave - 4) * 7 + letterOrder.indexOf(String(spelling)[0])
}
function noteY(midi) { return 181 - diatonicStepFromC4(midi) * 7 }
function ledgerLines(y) {
  const values = []
  if (Math.abs(y - 181) < 1) values.push(181)
  for (let line = 64; line >= y; line -= 14) values.push(line)
  for (let line = 298; line <= y; line += 14) values.push(line)
  return values
}
function xForBeat(beat) { return scanX + (beat - currentBeat.value) * pixelsPerBeat.value }
function beatForPointer(event) {
  const rect = readerSvg.value?.getBoundingClientRect()
  if (!rect?.width) return null
  const x = (event.clientX - rect.left) / rect.width * 1120
  return Math.max(0, currentBeat.value + (x - scanX) / pixelsPerBeat.value)
}
function pointerInViewBox(event) {
  const rect = readerSvg.value?.getBoundingClientRect()
  if (!rect?.width || !rect?.height) return null
  return {
    x: (event.clientX - rect.left) / rect.width * 1120,
    y: (event.clientY - rect.top) / rect.height * 360
  }
}
function nearestMidiForPitchClass(pitchClass, y) {
  let bestMidi = 60 + mod12(pitchClass)
  let bestDistance = Infinity
  for (let midi = 24; midi <= 96; midi += 1) {
    if (mod12(midi) !== mod12(pitchClass)) continue
    const distance = Math.abs(noteY(midi) - y)
    if (distance < bestDistance) {
      bestMidi = midi
      bestDistance = distance
    }
  }
  return bestMidi
}
function currentManualCycleStart(cycleLength = store.staffSequenceBeats) {
  // Manual composition starts at beat zero. Generated material keeps its
  // lead-in, but an untouched stopped staff must accept visible drops at once.
  return Math.max(0, Math.floor(currentBeat.value / cycleLength) * cycleLength)
}
function localManualBeat(absoluteBeat) {
  const cycleLength = store.staffSequenceBeats
  const cycleStart = currentManualCycleStart(cycleLength)
  let local = absoluteBeat - cycleStart
  while (local < 0) local += cycleLength
  while (local >= cycleLength) local -= cycleLength
  return local
}
function payloadFromDragEvent(event) {
  if (store.staffDragPayload) return store.staffDragPayload
  const clipRaw = event.dataTransfer?.getData('application/x-d3srt-clip')
  if (clipRaw) {
    try { return { type: 'clip', ...JSON.parse(clipRaw) } } catch { /* ignore */ }
  }
  const chordRaw = event.dataTransfer?.getData('application/x-midi-chord')
  if (chordRaw) {
    try { return { type: 'chord', ...JSON.parse(chordRaw) } } catch { /* ignore */ }
  }
  const raw = event.dataTransfer?.getData('application/x-pitch-class') || event.dataTransfer?.getData('text/plain')
  const pitchClass = Number(raw)
  return Number.isFinite(pitchClass) && pitchClass >= 0 && pitchClass <= 11
    ? { type: 'pitch', pitchClass }
    : null
}
function clipLengthBeats(payload) {
  return Math.max(0, ...(payload?.events || []).map((event) => Number(event.beat || 0) + Math.max(0.25, Number(event.duration) || 1)))
}
function previewNotesForPayload(payload, y) {
  if (!payload) return []
  if (payload.type === 'clip') {
    const first = (payload.events || []).find((event) => Array.isArray(event.midis) && event.midis.length)
    return first ? [...new Set(first.midis.map(Number).filter(Number.isFinite))] : []
  }
  if (payload.type === 'chord' && Array.isArray(payload.midis)) return shiftChordToPointer(payload.midis, y)
  if (payload.type === 'pitch') return [nearestMidiForPitchClass(payload.pitchClass, y)]
  return []
}
function updateDropPreview(event) {
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  const point = pointerInViewBox(event)
  const absoluteBeat = beatForPointer(event)
  const payload = payloadFromDragEvent(event)
  if (!point || absoluteBeat === null || !payload) return
  const midis = previewNotesForPayload(payload, Math.max(48, Math.min(310, point.y)))
  if (!midis.length) return
  const beat = localManualBeat(absoluteBeat)
  const x = xForBeat(currentManualCycleStart() + beat)
  dropPreview.value = {
    x,
    beat,
    width: payload.type === 'clip' ? Math.max(18, clipLengthBeats(payload) * pixelsPerBeat.value) : 0,
    beatLabel: String(Math.round(beat / store.staffQuantize) * store.staffQuantize + 1),
    label: payload.type === 'clip' ? (payload.label || 'Clip') : payload.type === 'chord' ? (payload.label || 'Chord') : displayLabelForMidi(midis[0]),
    notes: midis.map((midi) => ({
      midi,
      x,
      y: noteY(midi),
      accidental: accidentalForMidi(midi),
      ledgerLines: ledgerLines(noteY(midi))
    }))
  }
}
function clearDropPreview(event) {
  const related = event?.relatedTarget
  if (related && readerSvg.value?.contains?.(related)) return
  dropPreview.value = null
}
function placePitchAtPointer(event, pitchClass) {
  const point = pointerInViewBox(event)
  const absoluteBeat = beatForPointer(event)
  if (!point || absoluteBeat === null) return

  if (store.srtTransportState === 'playing') pause()
  if (store.srtSource !== 'staff') {
    store.srtSource = 'staff'
    store.clearClipSelection()
  }

  const midi = nearestMidiForPitchClass(pitchClass, point.y)
  const beat = localManualBeat(absoluteBeat)
  store.addStaffNote({ midi, beat, duration: 1 })
  refreshManualEvents()
  store.setFocus(`Added ${displayLabelForMidi(midi)} at beat ${Math.round(beat / store.staffQuantize) * store.staffQuantize + 1}`)
}
function shiftChordToPointer(midis, y) {
  const source = [...new Set((midis || []).map(Number).filter(Number.isFinite))].sort((a, b) => a - b)
  if (!source.length) return []
  let best = source
  let bestDistance = Infinity
  for (let shift = -48; shift <= 48; shift += 12) {
    const candidate = source.map((midi) => midi + shift)
    if (candidate.some((midi) => midi < 24 || midi > 96)) continue
    const averageY = candidate.reduce((sum, midi) => sum + noteY(midi), 0) / candidate.length
    const distance = Math.abs(averageY - y)
    if (distance < bestDistance) {
      best = candidate
      bestDistance = distance
    }
  }
  return best
}
function placeChordAtPointer(event, payload) {
  const point = pointerInViewBox(event)
  const absoluteBeat = beatForPointer(event)
  if (!point || absoluteBeat === null || !Array.isArray(payload?.midis)) return
  if (store.srtTransportState === 'playing') pause()
  if (store.srtSource !== 'staff') {
    store.srtSource = 'staff'
    store.clearClipSelection()
  }
  const beat = localManualBeat(absoluteBeat)
  const midis = shiftChordToPointer(payload.midis, point.y)
  midis.forEach((midi) => store.addStaffNote({ midi, beat, duration: 1 }))
  refreshManualEvents()
  store.setFocus(`Added ${payload.label || 'chord'} to the manual staff`)
}
function placeClipAtPointer(event, payload) {
  const absoluteBeat = beatForPointer(event)
  if (absoluteBeat === null || !Array.isArray(payload?.events) || !payload.events.length) return
  if (store.srtTransportState === 'playing') pause()
  if (store.srtSource !== 'staff') {
    store.srtSource = 'staff'
    store.clearClipSelection()
  }
  const startBeat = localManualBeat(absoluteBeat)
  for (const clipEvent of payload.events) {
    const beat = startBeat + Math.max(0, Number(clipEvent.beat) || 0)
    const duration = Math.max(0.25, Number(clipEvent.duration) || 1)
    for (const midi of clipEvent.midis || []) store.addStaffNote({ midi, beat, duration })
  }
  refreshManualEvents()
  store.setFocus(`Inserted ${payload.label || 'clip'} at beat ${Math.round(startBeat / store.staffQuantize) * store.staffQuantize + 1}`)
}
function dropPitch(event) {
  const payload = payloadFromDragEvent(event)
  dropPreview.value = null
  store.clearStaffDragPayload()
  if (!payload) return
  if (payload.type === 'clip') {
    placeClipAtPointer(event, payload)
    return
  }
  if (payload.type === 'chord' && Array.isArray(payload.midis)) {
    placeChordAtPointer(event, payload)
    return
  }
  if (payload.type === 'pitch' && Number.isFinite(Number(payload.pitchClass))) {
    placePitchAtPointer(event, Number(payload.pitchClass))
  }
}
function addSelectedAtPointer(event) {
  const pitchClass = store.selectedPitchClasses[0] ?? store.currentKey.tonic
  placePitchAtPointer(event, pitchClass)
}
function restGlyphForDuration(duration) {
  if (Number(duration) >= 2) return '𝄼'
  if (Number(duration) < 1) return '𝄾'
  return '𝄽'
}
function buildVisualEvent(event) {
  const playBeat = playbackBeatForEvent(event)
  const baseX = xForBeat(playBeat)
  if (event.isRest) {
    return {
      ...event,
      playBeat,
      x: baseX,
      notes: [],
      stems: [],
      restY: event.restClef === 'bass' ? 258 : 108,
      restGlyph: restGlyphForDuration(event.duration),
      crossing: Math.abs(baseX - scanX) < 13
    }
  }

  let previousY = null
  let alternate = false
  const rawNotes = event.midis.map((midi) => {
    const y = noteY(midi)
    if (previousY !== null && Math.abs(previousY - y) <= 8) alternate = !alternate
    else alternate = false
    previousY = y
    const x = baseX + (alternate ? 8 : 0)
    return {
      midi,
      x,
      y,
      label: displayLabelForMidi(midi),
      accidental: accidentalForMidi(midi),
      ledgerLines: ledgerLines(y)
    }
  })

  const groups = [
    rawNotes.filter((note) => note.y < 181).sort((a, b) => a.y - b.y),
    rawNotes.filter((note) => note.y >= 181).sort((a, b) => a.y - b.y)
  ]
  for (const group of groups) {
    group.forEach((note, index) => {
      const placeRight = index % 2 === 1
      note.labelX = note.x + (placeRight ? 17 : -17)
      note.labelY = note.y + (note.y < 181 ? -12 : 20)
      note.labelAnchor = placeRight ? 'start' : 'end'
    })
  }
  const notes = [...groups[0], ...groups[1]]

  const stemFor = (group, staff) => {
    if (!group.length) return null
    const ys = group.map((note) => note.y)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length
    const centerLine = staff === 'treble' ? 106 : 256
    const stemDown = meanY < centerLine
    if (stemDown) {
      return {
        x: baseX - 10,
        y1: minY,
        y2: Math.min(staff === 'treble' ? 170 : 304, maxY + 40)
      }
    }
    return {
      x: baseX + 10,
      y1: maxY,
      y2: Math.max(staff === 'treble' ? 58 : 190, minY - 40)
    }
  }
  const stems = [stemFor(groups[0], 'treble'), stemFor(groups[1], 'bass')].filter(Boolean)
  return { ...event, playBeat, x: baseX, notes, stems, crossing: Math.abs(baseX - scanX) < 13 }
}
function generatedEvent() {
  const pulseIndex = generatedPulseIndex
  generatedPulseIndex += 1
  const generated = generator.generate({
    key: store.compositionKey,
    beat: nextGeneratedBeat,
    // Duration is the written/nominal duration. Hold is applied live at playback.
    duration: Math.max(0.25, effectiveSpacing.value),
    material: store.srtMaterial,
    motion: store.srtMotion,
    clefMode: store.srtClefMode,
    rangeName: store.srtRange,
    style: store.srtStyle,
    chordSize: store.srtChordSize,
    bassPattern: store.srtBassPattern,
    exerciseMode: store.srtExerciseMode,
    progression: store.srtProgression,
    riffFlavor: store.srtRiffFlavor,
    dynamics: store.srtDynamics
  })
  const event = {
    ...generated,
    swingIndex: pulseIndex,
    swingUnit: effectiveSpacing.value
  }

  if (event.tieFromPrevious) {
    const previous = events.value[events.value.length - 1]
    const sameNotes = previous && !previous.isRest && previous.midis.length === event.midis.length
      && previous.midis.every((midi, index) => midi === event.midis[index])
    if (sameNotes) {
      previous.tieToNext = true
      previous.duration = Math.max(previous.duration, effectiveSpacing.value) + effectiveSpacing.value
      event.silent = true
    } else {
      event.tieFromPrevious = false
      event.silent = false
    }
  }
  return event
}
function swingOffsetForEvent(event) {
  const amount = Number(store.srtSwing) || 0
  if (amount <= 0) return 0

  // The slider's historical maximum is 45%. Map that maximum to a classic
  // 2:1 long-short pair: the second pulse is delayed by one third of a pulse.
  const strength = Math.max(0, Math.min(1, amount / 0.45))

  if (store.srtSource === 'generated') {
    const unit = Math.max(0.25, Number(event.swingUnit) || effectiveSpacing.value)
    return Number(event.swingIndex) % 2 === 1 ? strength * unit / 3 : 0
  }

  // For an edited/manual staff, swing only the written off-eighth positions.
  const fraction = ((Number(event.beat) % 1) + 1) % 1
  return Math.abs(fraction - 0.5) < 0.001 ? strength / 6 : 0
}
function playbackBeatForEvent(event) {
  return Number(event.beat) + swingOffsetForEvent(event)
}
function fillGeneratedAhead() {
  while (nextGeneratedBeat < currentBeat.value + horizonBeats) {
    events.value.push(generatedEvent())
    nextGeneratedBeat += effectiveSpacing.value
  }
}
function fillManualAhead() {
  if (!store.hasStaffSequence) return
  const cycleLength = store.staffSequenceBeats
  while (nextManualCycleBeat < currentBeat.value + horizonBeats) {
    for (const cluster of store.staffClusters) events.value.push({ id: `s-${nextManualCycleBeat}-${cluster.beat}`, beat: nextManualCycleBeat + cluster.beat, duration: cluster.duration, midis: cluster.events.map((event) => event.midi), clef: 'staff' })
    nextManualCycleBeat += cycleLength
    if (!store.srtLoopManual) break
  }
}
function fillAhead() {
  if (store.srtSource === 'staff') fillManualAhead()
  else fillGeneratedAhead()
  events.value.sort((a, b) => a.beat - b.beat)
}
function refreshManualEvents() {
  if (store.srtSource !== 'staff') return
  clearReleaseTimers()
  events.value = []
  nextManualCycleBeat = currentManualCycleStart()
  fillManualAhead()
  events.value.sort((a, b) => a.beat - b.beat)
  playedIds = new Set(
    events.value
      .filter((event) => playbackBeatForEvent(event) < currentBeat.value - 0.001)
      .map((event) => event.id)
  )
  previousBeat = currentBeat.value
}
function clearReleaseTimers() {
  releaseTimers.forEach((timer) => window.clearTimeout(timer))
  releaseTimers = []
  activeVoiceGroups.forEach((group) => { group.cancelled = true; stopChordVoices(group.voices, 0.05) })
  activeVoiceGroups = []
  store.clearPlaying('srt')
}
function prepareSession() {
  clearReleaseTimers()
  events.value = []
  currentBeat.value = 0
  previousBeat = 0
  nextGeneratedBeat = leadInBeats
  nextManualCycleBeat = store.srtSource === 'staff' ? 0 : leadInBeats
  playedIds = new Set()
  generatedPulseIndex = 0
  generator.reset()
  fillAhead()
}
function cancelAnimation() {
  if (animationFrame) window.cancelAnimationFrame(animationFrame)
  animationFrame = 0
}
async function play() {
  if (!hasPlayableSource.value || store.srtTransportState === 'playing') return
  const token = ++sessionToken
  await ensureAudioReady()
  if (token !== sessionToken) return
  store.setSrtTransportState('playing')
  const beatMs = 60000 / store.srtTempo
  startedAt = performance.now() - currentBeat.value * beatMs
  previousBeat = currentBeat.value - 0.001
  tick(performance.now())
}
function freezeTransport(state) {
  sessionToken += 1
  cancelAnimation()
  clearReleaseTimers()
  previousBeat = currentBeat.value
  store.setSrtTransportState(state)
}
function pause() {
  freezeTransport('paused')
}
function stop() {
  freezeTransport('stopped')
}
function resetOrReseed() {
  if (store.srtSource !== 'staff') {
    regenerate()
    store.setFocus('Reseeded the generated passage')
    return
  }

  sessionToken += 1
  cancelAnimation()
  clearReleaseTimers()
  store.setSrtTransportState('stopped')
  store.clearStaffSequence()
  store.clearClipSelection()
  events.value = []
  currentBeat.value = 0
  previousBeat = -0.001
  nextManualCycleBeat = 0
  playedIds = new Set()
  store.setFocus('Cleared the manual staff')
}

function regenerate() {
  const wasPlaying = store.srtTransportState === 'playing'
  sessionToken += 1
  cancelAnimation()
  clearReleaseTimers()
  store.setSrtTransportState('stopped')
  prepareSession()
  if (wasPlaying) play()
}
function rebaseTempoClock() {
  if (store.srtTransportState !== 'playing') return
  const beatMs = 60000 / store.srtTempo
  startedAt = performance.now() - currentBeat.value * beatMs
}
function tick(now) {
  if (store.srtTransportState !== 'playing') return
  const beatMs = 60000 / store.srtTempo
  currentBeat.value = (now - startedAt) / beatMs
  fillAhead()
  for (const event of events.value) {
    if (playedIds.has(event.id)) continue
    const playBeat = playbackBeatForEvent(event)
    if (playBeat > previousBeat && playBeat <= currentBeat.value + 0.025) {
      playedIds.add(event.id)
      if (event.isRest || event.silent || !event.midis?.length) continue
      // Gate/hold is deliberately evaluated at the instant of playback rather
      // than baked into generated events. The lower floor preserves short notes
      // instead of collapsing all low Hold settings into the same 240 ms blip.
      const holdSeconds = Math.max(0.075, event.duration * store.srtGate * beatMs / 1000)
      const releaseSeconds = Math.min(0.22, Math.max(0.07, holdSeconds * 0.16))
      const token = store.beginPlaying(event.midis, 'srt')
      const group = { token, voices: [], cancelled: false }
      activeVoiceGroups.push(group)
      startChord(event.midis, event.velocity || (event.midis.length > 1 ? 0.095 : 0.16)).then((voices) => {
        group.voices = voices.filter(Boolean)
        if (group.cancelled) { stopChordVoices(group.voices, 0.05); return }
        const timer = window.setTimeout(() => {
          stopChordVoices(group.voices, releaseSeconds)
          // Keep the gold player-piano indication through the audible release tail.
          const visualTimer = window.setTimeout(() => {
            store.endPlaying(token)
            activeVoiceGroups = activeVoiceGroups.filter((item) => item !== group)
          }, releaseSeconds * 1000)
          releaseTimers.push(visualTimer)
        }, holdSeconds * 1000)
        releaseTimers.push(timer)
      })
    }
  }
  previousBeat = currentBeat.value
  events.value = events.value.filter((event) => event.beat >= currentBeat.value - historyBeats)
  if (store.srtSource === 'staff' && !store.srtLoopManual && nextManualCycleBeat < currentBeat.value - 1) { stop(); return }
  animationFrame = window.requestAnimationFrame(tick)
}
function captureToStaff() {
  fillGeneratedAhead()
  const measureStart = Math.max(leadInBeats, Math.ceil(currentBeat.value / 4) * 4)
  const selected = events.value.filter((event) => event.beat >= measureStart && event.beat < measureStart + 8).map((event) => ({ beat: event.beat - measureStart, duration: event.duration, midis: event.midis }))
  store.replaceStaffSequence(selected)
  store.setFocus(`Captured ${selected.length} generated positions into the editable staff`)
}
function beginRangeSelection(event) {
  if (event.button !== 0) return
  const beat = beatForPointer(event)
  if (beat === null) return
  selecting = true
  selectionAnchor = beat
  store.setClipSelection(beat, beat)
  readerSvg.value?.setPointerCapture?.(event.pointerId)
}
function updateRangeSelection(event) {
  if (!selecting) return
  const beat = beatForPointer(event)
  if (beat !== null) store.setClipSelection(selectionAnchor, beat)
}
function finishRangeSelection(event) {
  if (!selecting) return
  updateRangeSelection(event)
  selecting = false
  readerSvg.value?.releasePointerCapture?.(event.pointerId)
}
function cancelRangeSelection() { selecting = false }
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

function saveSelection() {
  if (!canSaveSelection.value) return
  const start = store.clipSelectionStart
  const normalized = selectedEvents.value.map((event) => ({ beat: event.beat - start, duration: event.duration, midis: event.midis }))
  store.saveClip({ name: clipName.value || `Clip ${store.clips.length + 1}`, events: normalized })
  clipName.value = ''
  store.clearClipSelection()
}

watch(() => store.srtTransportNonce, () => {
  if (store.srtTransportCommand === 'play' || store.srtTransportCommand === 'start') play()
  else if (store.srtTransportCommand === 'pause') pause()
  else if (store.srtTransportCommand === 'save') saveSelection()
  else stop()
})
watch(() => store.srtGenerationNonce, regenerate)
watch(() => store.srtTempo, rebaseTempoClock)
watch(() => store.staffEvents.map((event) => `${event.id}:${event.beat}:${event.duration}:${event.midi}`).join('|'), refreshManualEvents)
watch(() => store.srtLoopManual, () => { if (store.srtSource === 'staff') regenerate() })
watch(() => store.activeTab, (tab) => { if (tab !== 'note-map' && store.srtTransportState === 'playing') pause() })
onMounted(() => { prepareSession(); store.setSrtTransportState('stopped') })
onBeforeUnmount(() => { sessionToken += 1; cancelAnimation(); clearReleaseTimers(); store.setSrtTransportState('stopped') })
</script>

<style scoped>
.srt-shell { display: grid; gap: 10px; width: 100%; margin: 0; padding: 2px; color: white; }
.srt-config-header { display: flex; justify-content: flex-end; align-items: center; min-height: 30px; padding: 1px 2px; border: 0; border-radius: 0; background: transparent; }
.srt-config-header > div { display: none; }
.srt-config-header span { color: #aaa; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.srt-controls { display: grid; gap: 8px; padding: 5px 2px 8px; border: 0; border-radius: 0; background: transparent; }
.srt-select-row { display: grid; grid-template-columns: repeat(6, minmax(145px, 1fr)); gap: 9px; align-items: center; }
.strato-guide { display: flex; align-items: center; gap: 8px; min-height: 30px; color: #d8d8d8; font-size: 15px; }
.srt-dial-row { display: flex; align-items: center; gap: 16px; padding-top: 3px; border-top: 0; }
.srt-action-row { display: flex; gap: 14px; align-items: center; justify-content: flex-end; margin-left: auto; white-space: nowrap; }
.dial-value { display: grid; place-items: center; line-height: 1.05; font-variant-numeric: tabular-nums; }
.dial-value strong { font-size: 15px; }
.dial-value span { margin-top: 2px; color: #cfcfcf; font-size: 10px; letter-spacing: .04em; }
.srt-action-row :deep(.image-checkbox) { min-width: 98px; }
.srt-controls :deep(.q-field__label), .srt-controls :deep(.q-field__native) { font-size: 17px; }
.scroll-stage { overflow: hidden; border: 0; border-radius: 5px; background: #202020; }
.scroll-svg { width: 100%; height: auto; display: block; touch-action: none; }
.stage-bg { fill: #232323; }
.staff-line, .ledger-line { stroke: #f4f4f4; stroke-width: 1.25; }
.middle-c-guide { stroke: rgba(255,255,255,.22); stroke-width: 1; stroke-dasharray: 5 7; }
.treble-clef { fill: #fff; font-size: 78px; }
.bass-clef { fill: #fff; font-size: 59px; }
.signature-symbol { fill: #fff; font-size: 27px; font-weight: 600; }
.beat-line { stroke: rgba(255,255,255,.055); stroke-width: 1; stroke-dasharray: 3 7; }
.bar-line { stroke: rgba(255,255,255,.26); stroke-width: 1.5; }
.measure-label { fill: #b0b0b0; font-size: 16px; }
.scroll-head { fill: #e6e6e6; stroke: #171717; stroke-width: 1.3; }
.scroll-event.crossing .scroll-head { fill: #d7a928; stroke: #fff1a6; stroke-width: 2; filter: drop-shadow(0 0 5px rgba(215,169,40,.9)); }
.note-stem { stroke: #eee; stroke-width: 1.4; }
.note-tie { fill: none; stroke: #e8e8e8; stroke-width: 2; }
.rest-symbol { fill: #e8e8e8; font-size: 34px; }
.note-accidental { fill: #f4f4f4; font-size: 23px; font-weight: 600; }
.scroll-label { fill: #bfeaff; font-size: 17px; font-weight: 650; paint-order: stroke; stroke: #202020; stroke-width: 3px; stroke-linejoin: round; }
.drop-guide { stroke: rgba(255,216,102,.75); stroke-width: 1.4; stroke-dasharray: 5 5; }
.clip-drop-span { fill: rgba(255,216,102,.08); stroke: rgba(255,216,102,.58); stroke-width: 1.2; stroke-dasharray: 6 5; }
.preview-head { fill: rgba(255,216,102,.72); stroke: #fff3b2; stroke-width: 1.8; }
.preview-ledger { stroke: rgba(255,243,178,.8); stroke-width: 1.2; }
.preview-accidental { fill: #fff3b2; font-size: 23px; }
.preview-label { fill: #ffd866; font-size: 16px; font-weight: 650; paint-order: stroke; stroke: #202020; stroke-width: 3px; }
.fixed-scanline { stroke: #ff5a5a; stroke-width: 2.6; filter: drop-shadow(0 0 5px rgba(255,90,90,.9)); }
.scan-marker { fill: #ff5a5a; }
.clip-selection { fill: rgba(215,169,40,.16); stroke: #ffd866; stroke-width: 1.5; stroke-dasharray: 6 4; pointer-events: none; }
.empty-state text { fill: #ddd; font-size: 24px; }
.empty-state .empty-sub { fill: #aaa; font-size: 18px; }
.clip-toolbar { display: grid; grid-template-columns: auto minmax(170px,.6fr) auto auto auto; gap: 10px; align-items: center; padding: 6px 0 0; border: 0; border-radius: 0; background: transparent; }
.clip-toolbar :deep(.q-field__label), .clip-toolbar :deep(.q-field__native), .clip-toolbar :deep(.q-btn__content) { font-size: 16px; }
.clip-library { display: grid; gap: 6px; border-top: 0; padding-top: 6px; }
.clip-library-title { font-size: 20px; font-weight: 650; color: #ffd866; }
.clip-row { display: grid; grid-template-columns: 28px 1fr auto auto; gap: 8px; align-items: center; padding: 7px 9px; border-radius: 7px; background: rgba(30,30,30,.75); cursor: grab; }
.clip-row:active { cursor: grabbing; }
.clip-drag-icon { color: #aaa; }
.clip-row strong { font-size: 18px; }
.clip-row span { display: block; color: #bbb; font-size: 15px; }
@media (max-width: 1200px) { .srt-select-row { grid-template-columns: repeat(3, minmax(150px,1fr)); } .srt-dial-row { flex-wrap: wrap; } .srt-action-row { justify-content: flex-start; margin-left: 0; } .clip-toolbar { grid-template-columns: auto 1fr; } }
@media (max-width: 700px) { .srt-config-header span { display: none; } .srt-shell { padding-inline: 0; } .srt-select-row { grid-template-columns: 1fr; } .srt-dial-row { align-items: center; } .srt-action-row { width: 100%; justify-content: space-between; } .clip-toolbar { grid-template-columns: auto 1fr; } .clip-toolbar :deep(.q-btn) { grid-column: span 2; } }
</style>
