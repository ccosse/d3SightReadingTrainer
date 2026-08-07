<template>
  <section class="instrument-section compact-instrument">
    <div class="svg-frame fretboard-frame">
      <svg
        class="instrument-svg"
        :viewBox="zoomedViewBox"
        role="img"
        aria-label="Scalable d3GuitarExplorer-style tapered Stratocaster fretboard with linked sounding-note highlights"
        @pointerleave="releasePreview"
      >
        <defs>
          <linearGradient id="d3geMahogany" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#3d1609" />
            <stop offset="0.5" stop-color="#2b0f06" />
            <stop offset="1" stop-color="#1a0804" />
          </linearGradient>
        </defs>

        <polygon :points="fretboard.boardPoints()" fill="url(#d3geMahogany)" class="board" />
        <polygon :points="fretboard.extensionPoints()" class="concept-extension" />

        <g v-if="store.showGuitarFrets">
          <g v-for="fret in fretboard.frets" :key="`fret-${fret.number}`">
            <line
              v-if="fret.number > 0"
              :x1="fret.x"
              :y1="fret.top"
              :x2="fret.x"
              :y2="fret.bottom"
              class="fret-wire"
              :class="{ 'beyond-wood': fret.beyondWood }"
            />
            <text
              v-if="store.showFretNumbers && fret.number > 0"
              :x="fret.centerX"
              y="204"
              text-anchor="middle"
              class="fret-number"
              :class="{ 'beyond-wood-number': fret.beyondWood }"
            >{{ fret.number }}</text>
          </g>
        </g>

        <line
          :x1="fretboard.nutX"
          :y1="fretboard.topAtNut"
          :x2="fretboard.nutX"
          :y2="fretboard.bottomAtNut"
          class="nut"
        />

        <g v-if="store.showNeckDots">
          <g v-for="fret in fretboard.dotFrets" :key="`dot-${fret}`">
            <circle
              v-for="(dot, index) in fretboard.dotPositions(fret)"
              :key="index"
              :cx="dot.x"
              :cy="dot.y"
              r="4.5"
              class="inlay"
              :class="{ 'extension-inlay': fret > fretboard.woodFretCount }"
            />
          </g>
        </g>

        <g v-for="string in fretboard.strings" :key="`string-${string.index}`">
          <line
            v-if="store.showGuitarStrings"
            :x1="fretboard.openX"
            :y1="string.y0"
            :x2="fretboard.endX"
            :y2="string.y1"
            class="guitar-string"
            :style="{ strokeWidth: 0.85 + string.index * 0.18 }"
          />

          <g v-for="note in string.notes" :key="`${string.index}-${note.fret}`">
            <title>String {{ 6 - string.index }}, fret {{ note.fret }}: {{ midiLabel(note.midi, store.accidentalMode) }} · press to hear</title>

            <circle
              :cx="note.x"
              :cy="note.y"
              r="13"
              class="note-hit"
              @mouseenter="focusNote(string, note)"
              @pointerdown.prevent="pressNote(note)"
              @pointerup.prevent="releasePreview"
              @pointercancel="releasePreview"
              @click="store.selectPitchClass(note.pitchClass)"
            />

            <circle
              v-if="store.notesAsDots && noteVisible(note)"
              :cx="note.x"
              :cy="note.y"
              :r="noteRadius(note)"
              class="note-dot"
              :class="noteClass(note)"
              @mouseenter="focusNote(string, note)"
              @pointerdown.prevent="pressNote(note)"
              @pointerup.prevent="releasePreview"
              @pointercancel="releasePreview"
              @click="store.selectPitchClass(note.pitchClass)"
            />

            <text
              v-if="store.notesAsNames && noteVisible(note)"
              :x="note.x"
              :y="note.y + 4.8"
              text-anchor="middle"
              class="note-label"
              :class="noteClass(note)"
              @mouseenter="focusNote(string, note)"
              @pointerdown.prevent="pressNote(note)"
              @pointerup.prevent="releasePreview"
              @pointercancel="releasePreview"
              @click="store.selectPitchClass(note.pitchClass)"
            >{{ store.noteName(note.pitchClass) }}</text>

            <text
              v-if="store.showOctavesFromE && noteVisible(note)"
              :x="note.x"
              :y="note.y + 15"
              text-anchor="middle"
              class="octave-label"
            >E{{ octaveFromE(note.midi) }}</text>
          </g>
        </g>
      </svg>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount } from 'vue'
import { startChord, stopChordVoices } from '../music/audio'
import { StratocasterFretboard as StratocasterFretboardModel } from '../music/instruments/StratocasterFretboard'
import { midiLabel } from '../music/theory'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const fretboard = new StratocasterFretboardModel({ fretCount: 24, woodFretCount: 22 })
const zoomedViewBox = computed(() => {
  const zoom = Math.max(0.75, Math.min(1.6, Number(store.fretboardZoom) || 1))
  const width = fretboard.width / zoom
  const height = fretboard.height / zoom
  const x = (fretboard.width - width) / 2
  const y = (fretboard.height - height) / 2
  return `${x} ${y} ${width} ${height}`
})
let previewVoices = []
let previewToken = null
let previewRequest = 0

function noteVisible(note) {
  return store.showAllNoteNames || store.isPlayingMidi(note.midi) || store.isSelected(note.pitchClass) || (store.showKeyOverlay && store.isInCurrentKey(note.pitchClass))
}

function noteClass(note) {
  return {
    selected: store.isSelected(note.pitchClass),
    playing: store.isPlayingMidi(note.midi),
    'current-key': store.showKeyOverlay && store.isInCurrentKey(note.pitchClass) && !store.isSelected(note.pitchClass),
    neutral: store.showAllNoteNames && !store.isSelected(note.pitchClass) && !(store.showKeyOverlay && store.isInCurrentKey(note.pitchClass)),
    'beyond-wood': note.beyondWood
  }
}

function noteRadius(note) {
  if (store.isPlayingMidi(note.midi)) return 9.2
  if (store.isSelected(note.pitchClass)) return 8.5
  if (store.showKeyOverlay && store.isInCurrentKey(note.pitchClass)) return 6.8
  return 3.2
}

async function pressNote(note) {
  releasePreview()
  const request = ++previewRequest
  previewToken = store.beginPlaying([note.midi], 'pointer')
  const voices = await startChord([note.midi], 0.15)
  if (request !== previewRequest) {
    stopChordVoices(voices, 0.05)
    return
  }
  previewVoices = voices
}

function releasePreview() {
  previewRequest += 1
  stopChordVoices(previewVoices, 0.10)
  previewVoices = []
  if (previewToken !== null) store.endPlaying(previewToken)
  previewToken = null
}

function octaveFromE(midi) {
  return Math.floor((midi - 40) / 12)
}

function focusNote(string, note) {
  const displayString = 6 - string.index
  store.setFocus(`String ${displayString} · fret ${note.fret} · ${midiLabel(note.midi, store.accidentalMode)}`)
}

onBeforeUnmount(releasePreview)
</script>

<style scoped>
.instrument-svg { width: 100%; height: auto; display: block; transition: none; touch-action: none; }
.svg-frame { border-radius: 7px; }
.fretboard-frame { overflow-x: auto; overflow-y: hidden; background: #666; padding: 3px 7px 0; scrollbar-color: #888 #444; }
.board { stroke: #8e5d45; stroke-width: 1.6; }
.concept-extension { fill: rgba(255, 255, 255, 0.025); stroke: #ddd; stroke-width: 1; stroke-dasharray: 4 3; }
.fret-wire { stroke: #ece7dd; stroke-width: 1.55; opacity: 0.96; }
.fret-wire.beyond-wood { stroke-dasharray: 4 3; }
.nut { stroke: #f7f1e5; stroke-width: 5; }
.guitar-string { stroke: #f7f7f7; opacity: 0.95; }
.inlay { fill: #e53935; stroke: #ffc2bf; stroke-width: 0.9; }
.extension-inlay { fill: #e53935; stroke: #ffc2bf; opacity: 0.92; }
.fret-number { fill: #f0f0f0; font-size: 13px; letter-spacing: -0.25px; }
.beyond-wood-number { fill: #d9efff; }
.note-hit { fill: transparent; cursor: pointer; }
.note-dot { cursor: pointer; stroke-width: 1; }
.note-dot.selected { fill: var(--asymptopia-green); stroke: #d7ffd3; }
.note-dot.current-key { fill: var(--asymptopia-green); stroke: #c8ffc3; opacity: .76; }
.note-dot.neutral { fill: #bdbdbd; stroke: #e6e6e6; opacity: 0.68; }
.note-dot.playing { fill: #d7a928; stroke: #fff1a6; stroke-width: 2; filter: drop-shadow(0 0 5px rgba(215, 169, 40, 0.85)); }
.note-dot.beyond-wood { stroke-dasharray: 2 1; }
.note-label { fill: #fff; font-size: 16px; cursor: pointer; user-select: none; font-weight: 600; }
.note-label.selected { fill: var(--asymptopia-green); font-weight: 800; }
.note-label.current-key { fill: var(--asymptopia-green); }
.note-label.neutral { fill: #e2e2e2; opacity: 0.76; }
.note-label.playing { fill: #ffd866; font-weight: 900; }
.octave-label { fill: #ffeb84; font-size: 12px; pointer-events: none; }
</style>
