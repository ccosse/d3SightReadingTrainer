<template>
  <section class="instrument-section compact-instrument">
    <div class="svg-frame fretboard-frame">
      <svg
        class="instrument-svg"
        :style="svgStyle"
        :viewBox="fretboard.viewBox"
        role="img"
        aria-label="Scalable d3GuitarExplorer-style tapered Stratocaster fretboard with 24 note positions"
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
            <title>
              String {{ 6 - string.index }}, fret {{ note.fret }}: {{ midiLabel(note.midi, store.accidentalMode) }}
            </title>

            <circle
              :cx="note.x"
              :cy="note.y"
              r="12"
              class="note-hit"
              @mouseenter="focusNote(string, note)"
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
              @click="store.selectPitchClass(note.pitchClass)"
            />

            <text
              v-if="store.notesAsNames && noteVisible(note)"
              :x="note.x"
              :y="note.y + 3.2"
              text-anchor="middle"
              class="note-label"
              :class="noteClass(note)"
              @mouseenter="focusNote(string, note)"
              @click="store.selectPitchClass(note.pitchClass)"
            >{{ store.noteName(note.pitchClass) }}</text>

            <text
              v-if="store.showOctavesFromE && noteVisible(note)"
              :x="note.x"
              :y="note.y + 12"
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
import { computed } from 'vue'
import { StratocasterFretboard as StratocasterFretboardModel } from '../music/instruments/StratocasterFretboard'
import { midiLabel } from '../music/theory'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const fretboard = new StratocasterFretboardModel({ fretCount: 24, woodFretCount: 22 })
const svgStyle = computed(() => ({ width: `${store.fretboardZoom * 100}%` }))

function noteVisible(note) {
  return store.showAllNoteNames || store.isSelected(note.pitchClass) || (store.showKeyOverlay && store.isInCurrentKey(note.pitchClass))
}

function noteClass(note) {
  return {
    selected: store.isSelected(note.pitchClass),
    'current-key': store.showKeyOverlay && store.isInCurrentKey(note.pitchClass) && !store.isSelected(note.pitchClass),
    neutral: store.showAllNoteNames && !store.isSelected(note.pitchClass) && !(store.showKeyOverlay && store.isInCurrentKey(note.pitchClass)),
    'beyond-wood': note.beyondWood
  }
}

function noteRadius(note) {
  if (store.isSelected(note.pitchClass)) return 8.5
  if (store.showKeyOverlay && store.isInCurrentKey(note.pitchClass)) return 6.8
  return 2.8
}

function octaveFromE(midi) {
  return Math.floor((midi - 40) / 12)
}

function focusNote(string, note) {
  const displayString = 6 - string.index
  store.setFocus(`String ${displayString} · fret ${note.fret} · ${midiLabel(note.midi, store.accidentalMode)}`)
}
</script>

<style scoped>
.instrument-svg { min-width: 100%; height: auto; display: block; transition: width 140ms ease; }
.svg-frame { border-radius: 7px; }
.fretboard-frame {
  overflow-x: auto;
  overflow-y: hidden;
  background: #666;
  padding: 3px 7px 0;
  scrollbar-color: #888 #444;
}
.board { stroke: #8e5d45; stroke-width: 1.6; }
.concept-extension { fill: rgba(255, 255, 255, 0.025); stroke: #ddd; stroke-width: 1; stroke-dasharray: 4 3; }
.fret-wire { stroke: #ece7dd; stroke-width: 1.55; opacity: 0.96; }
.fret-wire.beyond-wood { stroke-dasharray: 4 3; }
.nut { stroke: #f7f1e5; stroke-width: 5; }
.guitar-string { stroke: #f7f7f7; opacity: 0.95; }
.inlay { fill: #d8d5ca; stroke: #7c786f; stroke-width: 0.8; }
.extension-inlay { fill: #e5e5e5; stroke: #fff; opacity: 0.9; }
.fret-number { fill: #f0f0f0; font-size: 10px; }
.beyond-wood-number { fill: #d9efff; }
.note-hit { fill: transparent; cursor: pointer; }
.note-dot { cursor: pointer; stroke-width: 1; }
.note-dot.selected { fill: #00f035; stroke: #b7ffc7; }
.note-dot.current-key { fill: #00c72d; stroke: #72ff92; }
.note-dot.neutral { fill: #bdbdbd; stroke: #e6e6e6; opacity: 0.68; }
.note-dot.beyond-wood { stroke-dasharray: 2 1; }
.note-label { fill: #fff; font-size: 8.5px; cursor: pointer; user-select: none; }
.note-label.selected { fill: #0aff44; font-weight: 700; }
.note-label.current-key { fill: #55ff79; }
.note-label.neutral { fill: #e2e2e2; opacity: 0.76; }
.octave-label { fill: #ffeb84; font-size: 6.5px; pointer-events: none; }
</style>
