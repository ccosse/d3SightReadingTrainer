<template>
  <section class="instrument-section">
    <div class="row items-end justify-between q-mb-sm">
      <div>
        <div class="text-subtitle1 text-weight-medium">Stratocaster fretboard</div>
        <div class="text-caption text-grey-5">
          Equal-tempered fret spacing, tapered mahogany neck, standard E–A–D–G–B–E tuning.
        </div>
      </div>
      <div class="text-caption text-grey-4">note = (open string + fret) mod 12</div>
    </div>

    <div class="svg-frame fretboard-frame">
      <svg
        class="instrument-svg"
        :viewBox="fretboard.viewBox"
        role="img"
        aria-label="Scalable Stratocaster-style fretboard with linked note highlighting"
      >
        <defs>
          <linearGradient id="mahogany" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#7b4633" />
            <stop offset="0.52" stop-color="#5a2f24" />
            <stop offset="1" stop-color="#3d211b" />
          </linearGradient>
          <filter id="softShadow" x="-10%" y="-20%" width="120%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.45" />
          </filter>
        </defs>

        <polygon :points="fretboard.boardPoints()" fill="url(#mahogany)" class="board" filter="url(#softShadow)" />
        <rect
          :x="fretboard.openX"
          :y="fretboard.topAtNut"
          :width="fretboard.nutX - fretboard.openX"
          :height="fretboard.bottomAtNut - fretboard.topAtNut"
          class="open-zone"
        />

        <g v-for="fret in fretboard.frets" :key="`fret-${fret.number}`">
          <line
            v-if="fret.number > 0"
            :x1="fret.x"
            :y1="fret.top"
            :x2="fret.x"
            :y2="fret.bottom"
            class="fret-wire"
          />
          <text
            v-if="fret.number > 0"
            :x="fret.centerX"
            y="256"
            text-anchor="middle"
            class="fret-number"
          >{{ fret.number }}</text>
        </g>

        <line
          :x1="fretboard.nutX"
          :y1="fretboard.topAtNut"
          :x2="fretboard.nutX"
          :y2="fretboard.bottomAtNut"
          class="nut"
        />

        <g v-for="fret in fretboard.dotFrets" :key="`dot-${fret}`">
          <circle
            v-for="(dot, index) in fretboard.dotPositions(fret)"
            :key="index"
            :cx="dot.x"
            :cy="dot.y"
            r="6"
            class="inlay"
          />
        </g>

        <g v-for="string in fretboard.strings" :key="`string-${string.index}`">
          <line
            :x1="fretboard.openX"
            :y1="string.y0"
            :x2="fretboard.endX"
            :y2="string.y1"
            class="guitar-string"
            :style="{ strokeWidth: 1 + string.index * 0.24 }"
          />

          <g v-for="note in string.notes" :key="`${string.index}-${note.fret}`">
            <circle
              v-if="store.showKeyOverlay && store.isInCurrentKey(note.pitchClass) && !store.isSelected(note.pitchClass)"
              :cx="note.x"
              :cy="note.y"
              r="12"
              class="key-note"
            />
            <circle
              v-if="store.isSelected(note.pitchClass)"
              :cx="note.x"
              :cy="note.y"
              r="13"
              class="selected-note"
            />
            <text
              v-if="store.showAllNoteNames || store.isSelected(note.pitchClass) || (store.showKeyOverlay && store.isInCurrentKey(note.pitchClass))"
              :x="note.x"
              :y="note.y + 4"
              text-anchor="middle"
              class="note-label"
              :class="{ selected: store.isSelected(note.pitchClass) }"
              @mouseenter="focusNote(string, note)"
              @click="store.selectPitchClass(note.pitchClass)"
            >{{ store.noteName(note.pitchClass) }}</text>
          </g>
        </g>
      </svg>
    </div>
  </section>
</template>

<script setup>
import { StratocasterFretboard as StratocasterFretboardModel } from '../music/instruments/StratocasterFretboard'
import { midiLabel } from '../music/theory'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const fretboard = new StratocasterFretboardModel({ fretCount: 22 })

function focusNote(string, note) {
  const displayString = 6 - string.index
  store.setFocus(`String ${displayString} · fret ${note.fret} · ${midiLabel(note.midi, store.accidentalMode)}`)
}
</script>

<style scoped>
.instrument-svg { width: 100%; height: auto; display: block; }
.svg-frame { overflow: hidden; border-radius: 8px; }
.fretboard-frame { background: #1e1e1e; padding: 4px 8px 0; }
.board { stroke: #a06a4d; stroke-width: 2; }
.open-zone { fill: #292929; opacity: 0.9; }
.fret-wire { stroke: #d9d5cb; stroke-width: 2.1; opacity: 0.9; }
.nut { stroke: #f3eee2; stroke-width: 7; }
.guitar-string { stroke: #ddd7ca; opacity: 0.9; }
.inlay { fill: #e4ded0; stroke: #7a7368; stroke-width: 1; opacity: 0.92; }
.fret-number { fill: #d8d8d8; font-size: 12px; }
.key-note { fill: #78a979; opacity: 0.72; stroke: #c8e2c7; stroke-width: 1.5; }
.selected-note { fill: var(--q-primary); stroke: #d9efff; stroke-width: 1.5; }
.note-label { fill: #e2ded6; font-size: 10px; cursor: pointer; user-select: none; }
.note-label.selected { fill: #fff; font-weight: 700; }
</style>
