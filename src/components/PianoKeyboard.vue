<template>
  <section class="instrument-section">
    <div class="row items-end justify-between q-mb-sm">
      <div>
        <div class="text-subtitle1 text-weight-medium">Piano keyboard</div>
        <div class="text-caption text-grey-5">Scalable SVG; standard black and white key geometry.</div>
      </div>
      <div class="text-caption text-grey-4">{{ store.selectedSummary }}</div>
    </div>

    <div class="svg-frame keyboard-frame">
      <svg
        class="instrument-svg"
        :viewBox="keyboard.viewBox"
        role="img"
        aria-label="Piano keyboard linked to the selected pitch classes and current key"
      >
        <g v-for="key in keyboard.whiteKeys" :key="`white-${key.midi}`">
          <title>{{ midiLabel(key.midi, store.accidentalMode) }} · MIDI {{ key.midi }} · click to select</title>
          <rect
            :x="key.x"
            :y="key.y"
            :width="key.width"
            :height="key.height"
            rx="2"
            class="white-key"
            :class="keyClass(key)"
            @mouseenter="focusKey(key)"
            @click="store.selectPitchClass(key.pitchClass)"
          />
          <text
            :x="key.x + key.width / 2"
            :y="key.height - 15"
            text-anchor="middle"
            class="white-label"
            :class="{ inverse: store.isSelected(key.pitchClass) }"
          >{{ store.noteName(key.pitchClass) }}</text>
        </g>

        <g v-for="key in keyboard.blackKeys" :key="`black-${key.midi}`">
          <title>{{ midiLabel(key.midi, store.accidentalMode) }} · MIDI {{ key.midi }} · click to select</title>
          <rect
            :x="key.x"
            :y="key.y"
            :width="key.width"
            :height="key.height"
            rx="2"
            class="black-key"
            :class="keyClass(key)"
            @mouseenter="focusKey(key)"
            @click="store.selectPitchClass(key.pitchClass)"
          />
          <text
            :x="key.x + key.width / 2"
            :y="key.height - 13"
            text-anchor="middle"
            class="black-label"
          >{{ store.noteName(key.pitchClass) }}</text>
        </g>
      </svg>
    </div>
  </section>
</template>

<script setup>
import { PianoKeyboard as PianoKeyboardModel } from '../music/instruments/PianoKeyboard'
import { midiLabel } from '../music/theory'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const keyboard = new PianoKeyboardModel({ startMidi: 48, endMidi: 83, whiteWidth: 52, whiteHeight: 170 })

function keyClass(key) {
  return {
    selected: store.isSelected(key.pitchClass),
    'key-overlay': store.showKeyOverlay && store.isInCurrentKey(key.pitchClass)
  }
}

function focusKey(key) {
  store.setFocus(`Piano: ${midiLabel(key.midi, store.accidentalMode)} · MIDI ${key.midi}`)
}
</script>

<style scoped>
.instrument-svg { width: 100%; height: auto; display: block; }
.svg-frame { overflow: hidden; border-radius: 8px; }
.keyboard-frame { background: #171717; padding: 10px; }
.white-key { fill: #f8f8f4; stroke: #181818; stroke-width: 1.5; cursor: pointer; }
.black-key { fill: #111214; stroke: #050505; stroke-width: 1.5; cursor: pointer; }
.white-key.key-overlay { fill: #dbead8; }
.black-key.key-overlay { fill: #34513a; }
.white-key.selected, .black-key.selected { fill: var(--q-primary); }
.white-label { fill: #171717; font-size: 13px; pointer-events: none; }
.white-label.inverse, .black-label { fill: #fff; }
.black-label { font-size: 10px; pointer-events: none; }
</style>
