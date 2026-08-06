<template>
  <section class="instrument-section compact-instrument">
    <div
      class="svg-frame staff-frame"
      :class="{ 'sequence-mode': store.hasStaffSequence }"
      @dragover.stop.prevent
      @drop.stop.prevent="dropPitch"
    >
      <svg
        ref="staffSvg"
        class="instrument-svg"
        viewBox="0 0 1040 260"
        role="img"
        aria-label="Grand staff with key signature, linked note map, and editable dropped-note sequence"
        @dblclick="addSelectedAtPointer"
      >
        <g v-if="store.hasStaffSequence" class="beat-grid">
          <line
            v-for="beat in beatLines"
            :key="beat"
            :x1="beatX(beat)"
            :x2="beatX(beat)"
            y1="50"
            y2="224"
            :class="beat % 1 === 0 ? 'major-beat' : 'minor-beat'"
          />
          <text
            v-for="beat in wholeBeats"
            :key="`beat-label-${beat}`"
            :x="beatX(beat)"
            y="242"
            text-anchor="middle"
            class="beat-label"
          >{{ beat + 1 }}</text>
        </g>

        <g v-for="y in staffLines" :key="y">
          <line x1="82" :y1="y" x2="1010" :y2="y" class="staff-line" />
        </g>

        <text x="24" y="125" class="treble-clef">𝄞</text>
        <text x="29" y="218" class="bass-clef">𝄢</text>

        <g v-for="symbol in signatureSymbols" :key="`${symbol.clef}-${symbol.index}`">
          <text :x="symbol.x" :y="symbol.y" class="signature-symbol">{{ symbol.char }}</text>
        </g>

        <line x1="82" y1="141" x2="1010" y2="141" class="middle-c-guide" />

        <template v-if="!store.hasStaffSequence">
          <g v-for="note in displayedNotes" :key="`${note.midi}-${note.kind}`">
            <title>{{ note.label }} · click to select this pitch class everywhere</title>
            <line
              v-for="ledgerY in note.ledgerLines"
              :key="ledgerY"
              :x1="note.x - 17"
              :x2="note.x + 17"
              :y1="ledgerY"
              :y2="ledgerY"
              class="ledger-line"
            />
            <ellipse
              :cx="note.x"
              :cy="note.y"
              rx="10"
              ry="7"
              :class="[note.kind === 'selected' ? 'selected-head' : 'key-head', { playing: store.isPlayingPitchClass(note.pitchClass) }]"
              :transform="`rotate(-18 ${note.x} ${note.y})`"
              @mouseenter="store.setFocus(`Staff: ${note.label}`)"
              @click.stop="selectStaffPitch(note.pitchClass)"
            />
            <text :x="note.x" :y="note.y - 13" text-anchor="middle" class="staff-note-label">
              {{ note.label }}
            </text>
          </g>
        </template>

        <template v-else>
          <g
            v-for="cluster in sequenceClusters"
            :key="`cluster-${cluster.beat}`"
            class="sequence-cluster"
            :class="{ selected: cluster.beat === store.selectedStaffBeat }"
            @click.stop="store.setSelectedStaffBeat(cluster.beat)"
            @dblclick.stop
          >
            <title>
              Beat {{ cluster.beat + 1 }}: {{ cluster.label }} · click to edit this chord or note group
            </title>

            <line
              v-if="cluster.stem"
              :x1="cluster.stem.x"
              :x2="cluster.stem.x"
              :y1="cluster.stem.y1"
              :y2="cluster.stem.y2"
              class="note-stem"
            />

            <g v-for="note in cluster.notes" :key="note.id">
              <line
                v-for="ledgerY in note.ledgerLines"
                :key="ledgerY"
                :x1="note.x - 16"
                :x2="note.x + 16"
                :y1="ledgerY"
                :y2="ledgerY"
                class="ledger-line"
              />
              <ellipse
                :cx="note.x"
                :cy="note.y"
                rx="10"
                ry="7"
                class="sequence-head"
                :class="{ selected: cluster.beat === store.selectedStaffBeat, playing: store.isPlayingPitchClass(note.pitchClass) }"
                :transform="`rotate(-18 ${note.x} ${note.y})`"
                @mouseenter="store.setFocus(`Staff sequence: ${note.label} at beat ${cluster.beat + 1}`)"
                @click.stop="selectSequenceNote(cluster.beat, note.pitchClass)"
              />
              <text :x="note.x" :y="note.y - 13" text-anchor="middle" class="staff-note-label sequence-label">
                {{ note.label }}
              </text>
            </g>
          </g>
        </template>

        <line
          v-if="store.scanPlaying"
          :x1="scanX"
          :x2="scanX"
          y1="45"
          y2="226"
          class="scanline"
        />
      </svg>
    </div>

    <div class="staff-tools">
      <div class="staff-hint">
        <q-icon name="drag_indicator" size="16px" />
        Drag a note-name button onto the staff, or double-click the staff. Nearby drops snap to the same beat and form a chord.
      </div>

      <div class="staff-tool-controls">
        <div class="staff-zoom-control">
          <span>{{ visibleBeats / 4 }} bars</span>
          <q-slider
            :model-value="store.staffZoom"
            :min="0.55"
            :max="1.6"
            :step="0.05"
            snap
            dense
            color="grey-5"
            @update:model-value="store.setStaffZoom"
          >
            <q-tooltip v-if="store.tooltipsEnabled">Change the time scale. Zoom out to show more measures at full readable staff size; zoom in to spread fewer measures wider.</q-tooltip>
          </q-slider>
        </div>

        <q-select
          dense
          dark
          outlined
          emit-value
          map-options
          label="Snap"
          :model-value="store.staffQuantize"
          :options="quantizeOptions"
          @update:model-value="store.setStaffQuantize"
        >
          <q-tooltip v-if="store.tooltipsEnabled">Quantize new notes to quarter-beat, half-beat, or whole-beat positions.</q-tooltip>
        </q-select>

        <template v-if="store.selectedStaffCluster">
          <q-select
            dense
            dark
            outlined
            emit-value
            map-options
            label="Beat"
            :model-value="store.selectedStaffCluster.beat"
            :options="beatOptions"
            @update:model-value="moveSelectedCluster"
          >
            <q-tooltip v-if="store.tooltipsEnabled">Move the selected note or chord to another snapped beat.</q-tooltip>
          </q-select>

          <q-select
            dense
            dark
            outlined
            emit-value
            map-options
            label="Duration"
            :model-value="store.selectedStaffCluster.duration"
            :options="durationOptions"
            @update:model-value="setSelectedDuration"
          >
            <q-tooltip v-if="store.tooltipsEnabled">Set one shared duration for every note in the selected cluster.</q-tooltip>
          </q-select>

          <q-btn dense flat color="grey-5" icon="delete" @click="removeSelectedCluster">
            <q-tooltip v-if="store.tooltipsEnabled">Delete the selected note or chord cluster.</q-tooltip>
          </q-btn>
        </template>

        <q-btn
          v-if="store.hasStaffSequence"
          dense
          flat
          color="grey-4"
          icon="clear_all"
          label="Clear sequence"
          no-caps
          @click="store.clearStaffSequence"
        >
          <q-tooltip v-if="store.tooltipsEnabled">Remove all dropped staff notes and return to the linked note-map display.</q-tooltip>
        </q-btn>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { midiLabel, mod12 } from '../music/theory'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const staffSvg = ref(null)
const staffLines = [71, 85, 99, 113, 127, 155, 169, 183, 197, 211]
const letterOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const pitchLetterSharp = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B']
const pitchLetterFlat = ['C', 'D', 'D', 'E', 'E', 'F', 'G', 'G', 'A', 'A', 'B', 'B']
const sequenceStartX = 190
const sequenceEndX = 1000
const sequenceWidth = sequenceEndX - sequenceStartX
const baseViewWidth = 1040
const baseViewHeight = 260
const visibleBeats = computed(() => store.staffVisibleBeats)

const quantizeOptions = [
  { label: '¼ beat', value: 0.25 },
  { label: '½ beat', value: 0.5 },
  { label: '1 beat', value: 1 }
]
const durationOptions = [
  { label: '¼ beat', value: 0.25 },
  { label: '½ beat', value: 0.5 },
  { label: '1 beat', value: 1 },
  { label: '2 beats', value: 2 },
  { label: '4 beats', value: 4 }
]

const wholeBeats = computed(() => Array.from({ length: visibleBeats.value }, (_, index) => index))
const beatLines = computed(() => {
  const values = []
  for (let beat = 0; beat <= visibleBeats.value; beat += store.staffQuantize) {
    values.push(Number(beat.toFixed(2)))
  }
  return values
})
const beatOptions = computed(() => beatLines.value
  .filter((beat) => beat < visibleBeats.value)
  .map((beat) => ({ label: `${beat + 1}`, value: beat })))
const scanX = computed(() => sequenceStartX + store.scanProgress * sequenceWidth)

function diatonicStepFromC4(midi) {
  const pc = mod12(midi)
  const octave = Math.floor(midi / 12) - 1
  const letters = store.accidentalMode === 'flat' ? pitchLetterFlat : pitchLetterSharp
  const letterIndex = letterOrder.indexOf(letters[pc])
  return (octave - 4) * 7 + letterIndex
}

function noteY(midi) {
  return 141 - diatonicStepFromC4(midi) * 7
}

function ledgerLines(y) {
  const values = []
  if (Math.abs(y - 141) < 1) values.push(141)
  for (let line = 57; line >= y; line -= 14) values.push(line)
  for (let line = 225; line <= y; line += 14) values.push(line)
  return values
}

function beatX(beat) {
  return sequenceStartX + (beat / visibleBeats.value) * sequenceWidth
}

function nearestMidiForPitchClass(pitchClass, y) {
  let bestMidi = 60 + mod12(pitchClass)
  let bestDistance = Infinity
  for (let midi = 36; midi <= 84; midi += 1) {
    if (mod12(midi) !== mod12(pitchClass)) continue
    const distance = Math.abs(noteY(midi) - y)
    if (distance < bestDistance) {
      bestMidi = midi
      bestDistance = distance
    }
  }
  return bestMidi
}

function pointerInViewBox(event) {
  const svg = staffSvg.value
  if (!svg) return null
  const rect = svg.getBoundingClientRect()
  if (!rect.width || !rect.height) return null
  return {
    x: ((event.clientX - rect.left) / rect.width) * baseViewWidth,
    y: ((event.clientY - rect.top) / rect.height) * baseViewHeight
  }
}

function beatFromX(x) {
  const raw = (Math.max(sequenceStartX, Math.min(sequenceEndX, x)) - sequenceStartX) / sequenceWidth * visibleBeats.value
  return raw
}

function dropPitch(event) {
  const point = pointerInViewBox(event)
  if (!point) return
  const raw = event.dataTransfer.getData('application/x-pitch-class') || event.dataTransfer.getData('text/plain')
  const pitchClass = Number(raw)
  if (!Number.isFinite(pitchClass) || pitchClass < 0 || pitchClass > 11) return
  store.addStaffNote({
    midi: nearestMidiForPitchClass(pitchClass, point.y),
    beat: beatFromX(point.x),
    duration: 1
  })
}

function addSelectedAtPointer(event) {
  const point = pointerInViewBox(event)
  if (!point) return
  const pitchClass = store.selectedPitchClasses[0] ?? store.currentKey.tonic
  store.addStaffNote({
    midi: nearestMidiForPitchClass(pitchClass, point.y),
    beat: beatFromX(point.x),
    duration: 1
  })
}

function selectStaffPitch(pitchClass) {
  store.setMode('major')
  store.selectPitchClass(pitchClass)
}

function selectSequenceNote(beat, pitchClass) {
  store.setMode('major')
  store.setSelectedStaffBeat(beat)
  store.selectPitchClass(pitchClass)
}

function moveSelectedCluster(value) {
  if (!store.selectedStaffCluster) return
  store.moveStaffCluster(store.selectedStaffCluster.beat, value)
}

function setSelectedDuration(value) {
  if (!store.selectedStaffCluster) return
  store.setStaffClusterDuration(store.selectedStaffCluster.beat, value)
}

function removeSelectedCluster() {
  if (!store.selectedStaffCluster) return
  store.removeStaffCluster(store.selectedStaffCluster.beat)
}

const displayedNotes = computed(() => {
  const candidates = []
  for (let midi = 48; midi <= 83; midi += 1) {
    const pc = mod12(midi)
    const selected = store.isSelected(pc)
    const inKey = store.showKeyOverlay && store.isInCurrentKey(pc)
    if (selected || inKey) {
      candidates.push({ midi, pitchClass: pc, kind: selected ? 'selected' : 'key' })
    }
  }

  const maxNotes = 28
  const sampled = candidates.length > maxNotes
    ? candidates.filter((_, index) => index % Math.ceil(candidates.length / maxNotes) === 0).slice(0, maxNotes)
    : candidates
  const width = 760
  const spacing = sampled.length > 1 ? width / (sampled.length - 1) : 0

  return sampled.map((note, index) => {
    const y = noteY(note.midi)
    return {
      ...note,
      x: sampled.length === 1 ? 600 : 225 + index * spacing,
      y,
      label: midiLabel(note.midi, store.accidentalMode),
      ledgerLines: ledgerLines(y)
    }
  })
})

const sequenceClusters = computed(() => store.staffClusters.map((cluster) => {
  const baseX = beatX(cluster.beat)
  let previousY = null
  let alternate = false
  const notes = cluster.events.map((event) => {
    const y = noteY(event.midi)
    if (previousY !== null && Math.abs(previousY - y) <= 8) alternate = !alternate
    else alternate = false
    previousY = y
    const x = baseX + (alternate ? 8 : 0)
    return {
      ...event,
      x,
      y,
      pitchClass: mod12(event.midi),
      label: midiLabel(event.midi, store.accidentalMode),
      ledgerLines: ledgerLines(y)
    }
  })
  const ys = notes.map((note) => note.y)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const averageY = ys.reduce((sum, value) => sum + value, 0) / ys.length
  const stemUp = averageY >= 141
  const stem = stemUp
    ? { x: baseX + 10, y1: maxY, y2: Math.max(48, minY - 34) }
    : { x: baseX - 10, y1: minY, y2: Math.min(225, maxY + 34) }
  return {
    ...cluster,
    notes,
    stem,
    label: notes.map((note) => note.label).join(' · ')
  }
}))

const signatureSymbols = computed(() => {
  const signature = store.currentKey.signature
  if (signature === 0) return []
  const count = Math.abs(signature)
  const char = signature > 0 ? '♯' : '♭'
  const trebleSharps = [76, 97, 69, 90, 111, 83, 104]
  const bassSharps = [174, 195, 167, 188, 209, 181, 202]
  const trebleFlats = [104, 83, 111, 90, 118, 97, 125]
  const bassFlats = [202, 181, 209, 188, 216, 195, 223]
  const treble = signature > 0 ? trebleSharps : trebleFlats
  const bass = signature > 0 ? bassSharps : bassFlats
  const result = []
  for (let index = 0; index < count; index += 1) {
    const x = 92 + index * 17
    result.push({ clef: 'treble', index, x, y: treble[index], char })
    result.push({ clef: 'bass', index, x, y: bass[index], char })
  }
  return result
})
</script>

<style scoped>
.instrument-svg { width: 100%; height: auto; display: block; }
.svg-frame { overflow: hidden; border-radius: 8px; }
.staff-frame { background: #262626; padding: 4px; border: 1px solid transparent; }
.staff-frame.sequence-mode { border-color: rgba(141, 255, 171, 0.34); }
.staff-line, .ledger-line { stroke: #f1f1f1; stroke-width: 1.25; }
.middle-c-guide { stroke: #8e8e8e; stroke-width: 1; stroke-dasharray: 5 7; opacity: 0.35; }
.treble-clef { fill: #fff; font-size: 73px; }
.bass-clef { fill: #fff; font-size: 54px; }
.signature-symbol { fill: #fff; font-size: 27px; font-weight: 600; }
.selected-head { fill: var(--q-primary); stroke: #d9efff; stroke-width: 1.2; cursor: pointer; }
.key-head { fill: #6f9d72; stroke: #c8e2c7; stroke-width: 1.2; cursor: pointer; opacity: 0.9; }
.staff-note-label { fill: #fff; font-size: 18px; pointer-events: none; }
.sequence-label { fill: #c8ffd5; }
.beat-grid line { pointer-events: none; }
.major-beat { stroke: rgba(255, 255, 255, 0.18); stroke-width: 1; }
.minor-beat { stroke: rgba(255, 255, 255, 0.07); stroke-width: 0.8; stroke-dasharray: 3 5; }
.beat-label { fill: #aaa; font-size: 16px; }
.note-stem { stroke: #e9f8ed; stroke-width: 1.4; }
.sequence-head { fill: #12c84c; stroke: #caffd8; stroke-width: 1.2; cursor: pointer; }
.sequence-cluster.selected .sequence-head,
.sequence-head.selected { fill: var(--q-primary); stroke: #e5f5ff; stroke-width: 2; }
.selected-head.playing, .key-head.playing, .sequence-head.playing { fill: #d7a928; stroke: #fff1a6; stroke-width: 2.2; filter: drop-shadow(0 0 5px rgba(215, 169, 40, 0.85)); }
.scanline { stroke: #8dffab; stroke-width: 2.4; opacity: 0.92; filter: drop-shadow(0 0 5px rgba(141, 255, 171, 0.8)); pointer-events: none; }
.staff-tools {
  display: grid;
  grid-template-columns: minmax(250px, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 6px 4px 0;
}
.staff-hint { color: #d2d8da; font-size: 16px; display: flex; align-items: center; gap: 5px; }
.staff-tool-controls { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 6px; }
.staff-tool-controls :deep(.q-field) { min-width: 96px; }
.staff-zoom-control { display: grid; grid-template-columns: 34px 112px; align-items: center; gap: 5px; color: #9ed5ff; font-size: 16px; }
.staff-zoom-control :deep(.q-slider) { margin: 0; }

@media (max-width: 820px) {
  .staff-tools { grid-template-columns: 1fr; }
  .staff-tool-controls { justify-content: flex-start; }
}
</style>
