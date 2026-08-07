<template>
  <section class="instrument-section compact-instrument">
    <div class="svg-frame keyboard-frame">
      <svg
        class="instrument-svg"
        :viewBox="keyboard.viewBox"
        role="img"
        :aria-label="`${preset.label} piano keyboard linked to selected, current-key, and currently sounding notes`"
        @pointerleave="releasePreview"
      >
        <g v-for="key in keyboard.whiteKeys" :key="`white-${key.midi}`">
          <title>{{ midiLabel(key.midi, store.accidentalMode) }} · MIDI {{ key.midi }} · press to hear · click to select</title>
          <rect
            :x="key.x"
            :y="key.y"
            :width="key.width"
            :height="key.height"
            rx="2"
            class="white-key"
            :class="keyClass(key)"
            @mouseenter="focusKey(key)"
            @pointerdown.prevent="pressKey(key)"
            @pointerup.prevent="releasePreview"
            @pointercancel="releasePreview"
            @click="store.selectPitchClass(key.pitchClass)"
          />
          <text
            v-if="showLabel(key)"
            :x="key.x + key.width / 2"
            :y="key.height - 15"
            text-anchor="middle"
            class="white-label"
            :class="{ inverse: store.isSelected(key.pitchClass) || store.isPlayingMidi(key.midi) }"
          >{{ keyLabel(key) }}</text>
        </g>

        <g v-for="key in keyboard.blackKeys" :key="`black-${key.midi}`">
          <title>{{ midiLabel(key.midi, store.accidentalMode) }} · MIDI {{ key.midi }} · press to hear · click to select</title>
          <rect
            :x="key.x"
            :y="key.y"
            :width="key.width"
            :height="key.height"
            rx="2"
            class="black-key"
            :class="keyClass(key)"
            @mouseenter="focusKey(key)"
            @pointerdown.prevent="pressKey(key)"
            @pointerup.prevent="releasePreview"
            @pointercancel="releasePreview"
            @click="store.selectPitchClass(key.pitchClass)"
          />
          <text
            v-if="showLabel(key)"
            :x="key.x + key.width / 2"
            :y="key.height - 13"
            text-anchor="middle"
            class="black-label"
          >{{ keyLabel(key) }}</text>
        </g>
      </svg>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount } from 'vue'
import { PianoKeyboard as PianoKeyboardModel } from '../music/instruments/PianoKeyboard'
import { keyboardPresetById } from '../music/keyboardPresets'
import { startChord, stopChordVoices } from '../music/audio'
import { midiLabel } from '../music/theory'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const preset = computed(() => keyboardPresetById(store.keyboardPreset))
const keyboard = computed(() => new PianoKeyboardModel({
  startMidi: preset.value.startMidi,
  endMidi: preset.value.endMidi,
  whiteWidth: preset.value.whiteWidth,
  whiteHeight: preset.value.whiteHeight
}))
let previewVoices = []
let previewToken = null
let previewRequest = 0

function keyClass(key) {
  return {
    selected: store.isSelected(key.pitchClass),
    'current-key': store.showKeyOverlay && store.isInCurrentKey(key.pitchClass) && !store.isSelected(key.pitchClass),
    playing: store.isPlayingMidi(key.midi)
  }
}

function showLabel(key) {
  if (preset.value.id === 'reface-37') return true
  return key.pitchClass === 0 || store.isPlayingMidi(key.midi)
}

function keyLabel(key) {
  if (preset.value.id === 'reface-37') return store.noteName(key.pitchClass)
  return midiLabel(key.midi, store.accidentalMode)
}

async function pressKey(key) {
  releasePreview()
  const request = ++previewRequest
  previewToken = store.beginPlaying([key.midi], 'pointer')
  const voices = await startChord([key.midi], 0.16)
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

function focusKey(key) {
  store.setFocus(`${midiLabel(key.midi, store.accidentalMode)} · MIDI ${key.midi}`)
}

onBeforeUnmount(releasePreview)
</script>

<style scoped>
.instrument-svg { width: 100%; height: auto; display: block; touch-action: none; }
.svg-frame { border-radius: 8px; overflow: hidden; }
.keyboard-frame { background: #202020; padding: 3px; }
.white-key { fill: #fafafa; stroke: #111; stroke-width: 1.25; cursor: pointer; }
.black-key { fill: #111; stroke: #000; stroke-width: 1.25; cursor: pointer; }
.white-key.current-key { fill: #d9eadc; stroke: var(--asymptopia-green); }
.black-key.current-key { fill: #31553a; stroke: var(--asymptopia-green); }
.white-key.selected, .black-key.selected { fill: var(--q-primary); stroke: #d9efff; }
.white-key.playing, .black-key.playing { fill: #d7a928; stroke: #fff1a6; stroke-width: 2.2; filter: drop-shadow(0 0 5px rgba(215, 169, 40, 0.78)); }
.white-label { fill: #171717; font-size: 22px; pointer-events: none; font-weight: 600; }
.white-label.inverse { fill: #fff; }
.black-label { fill: #fff; font-size: 17px; pointer-events: none; font-weight: 600; }
</style>
