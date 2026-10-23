<template>
  <section class="srt-shell">
    <div class="scroll-stage">
      <svg
        ref="readerSvg"
        class="scroll-svg"
        viewBox="0 0 1120 380"
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
        <rect x="0" y="0" width="1120" height="380" class="stage-bg" />
        <defs>
          <clipPath id="moving-note-clip">
            <rect x="176" y="20" width="916" height="342" />
          </clipPath>
        </defs>

        <g class="moving-grid">
          <g v-for="marker in timelineMarkers" :key="marker.key">
            <line :x1="marker.x" :x2="marker.x" y1="44" y2="334" :class="marker.isBar ? 'bar-line' : 'beat-line'" />
            <text v-if="marker.isBar" :x="marker.x + 6" y="31" class="measure-label">{{ marker.measure }}</text>
          </g>
        </g>

        <g v-for="y in staffLines" :key="y"><line x1="28" :y1="y" x2="1092" :y2="y" class="staff-line" /></g>
        <line x1="28" y1="181" x2="1092" y2="181" class="middle-c-guide" />
        <text x="38" y="150" class="treble-clef">𝄞</text>
        <text x="42" y="292" class="bass-clef">𝄢</text>
        <g v-for="symbol in signatureSymbols" :key="`${symbol.clef}-${symbol.index}`"><text :x="symbol.x" :y="symbol.y" class="signature-symbol">{{ symbol.char }}</text></g>

        <g v-if="!captureDisplayActive && !hasPlayableSource" class="empty-state">
          <text x="560" y="165" text-anchor="middle">The manual staff is empty.</text>
          <text x="560" y="194" text-anchor="middle" class="empty-sub">Add notes on Note Map, or switch Source to Generated.</text>
        </g>

        <g clip-path="url(#moving-note-clip)">
          <path v-for="tie in visibleTies" :key="tie.key" :d="tie.path" class="note-tie" />
          <g v-for="event in (captureDisplayActive ? [] : visibleEvents)" :key="event.id" class="scroll-event" :class="{ crossing: event.crossing }">
            <text v-if="event.isRest" :x="event.x" :y="event.restY" text-anchor="middle" class="rest-symbol">{{ event.restGlyph }}</text>
            <line v-for="(stem, stemIndex) in event.stems" :key="`${event.id}-stem-${stemIndex}`" :x1="stem.x" :x2="stem.x" :y1="stem.y1" :y2="stem.y2" class="note-stem" />
            <g v-for="note in event.notes" :key="`${event.id}-${note.midi}`">
              <line v-for="ledgerY in note.ledgerLines" :key="ledgerY" :x1="note.x - 18" :x2="note.x + 18" :y1="ledgerY" :y2="ledgerY" class="ledger-line" />
              <text v-if="note.accidental" :x="note.x - 19" :y="note.y + 7" text-anchor="middle" class="note-accidental">{{ note.accidental }}</text>
              <ellipse :cx="note.x" :cy="note.y" rx="10" ry="7" :transform="`rotate(-18 ${note.x} ${note.y})`" class="scroll-head" />
              <text v-if="store.srtShowLabels" :x="note.labelX" :y="note.labelY" :text-anchor="note.labelAnchor" class="scroll-label">{{ note.label }}</text>
            </g>
          </g>
        </g>
        <g v-for="event in (captureDisplayActive ? capturedVisualEvents : [])" :key="event.id" class="captured-event">
          <g v-for="note in event.notes" :key="`${event.id}-${note.midi}`">
            <line v-for="ledgerY in note.ledgerLines" :key="ledgerY" :x1="note.x - 18" :x2="note.x + 18" :y1="ledgerY" :y2="ledgerY" class="ledger-line" />
            <text v-if="note.accidental" :x="note.x - 19" :y="note.y + 7" text-anchor="middle" class="note-accidental">{{ note.accidental }}</text>
            <ellipse :cx="note.x" :cy="note.y" rx="10" ry="7" class="capture-head" />
            <path v-if="store.srtShowLabels && note.labelY !== note.y + 5" :d="`M${note.x + 11} ${note.y} L${note.x + 14} ${note.labelY - 4}`" class="capture-label-guide" />
            <text v-if="store.srtShowLabels" :x="note.labelX" :y="note.labelY" class="capture-label">{{ note.label }}</text>
          </g>
        </g>

        <g v-if="dropPreview" class="drop-preview" pointer-events="none">
          <rect v-if="dropPreview.width" :x="dropPreview.x" y="45" :width="dropPreview.width" height="289" class="clip-drop-span" />
          <line :x1="dropPreview.x" :x2="dropPreview.x" y1="45" y2="334" class="drop-guide" />
          <g v-for="note in dropPreview.notes" :key="`preview-${note.midi}`">
            <line v-for="ledgerY in note.ledgerLines" :key="ledgerY" :x1="note.x - 18" :x2="note.x + 18" :y1="ledgerY" :y2="ledgerY" class="preview-ledger" />
            <text v-if="note.accidental" :x="note.x - 19" :y="note.y + 7" text-anchor="middle" class="preview-accidental">{{ note.accidental }}</text>
            <ellipse :cx="note.x" :cy="note.y" rx="10" ry="7" :transform="`rotate(-18 ${note.x} ${note.y})`" class="preview-head" />
          </g>
          <text :x="dropPreview.x + 14" y="56" class="preview-label">{{ dropPreview.label }} · beat {{ dropPreview.beatLabel }}</text>
        </g>

        <rect v-if="selectionVisual" :x="selectionVisual.x" y="42" :width="selectionVisual.width" height="294" class="clip-selection" />
        <line :x1="scanX" :x2="scanX" y1="34" y2="338" class="fixed-scanline" />
        <polygon :points="`${scanX - 7},34 ${scanX + 7},34 ${scanX},46`" class="scan-marker" />
      </svg>
    </div>

    <div v-show="!unifiedTransport" class="recording-console" :class="{ 'recording-console--unified': unifiedTransport }">
      <div v-if="!unifiedTransport" class="tape-deck" role="group" aria-label="Unified piano tape transport">
        <button type="button" class="tape-key record-key" :title="store.tooltipsEnabled ? 'Record incoming MIDI notes without generating any background music' : undefined" aria-label="Record" :disabled="liveCapture.recording || takePlaying" @click="transportRecord">● <span>Record</span></button>
        <button type="button" class="tape-key" :class="{ 'tape-paused': takePaused || store.srtTransportState === 'paused' }" :title="store.tooltipsEnabled ? (takePlaying || store.srtTransportState === 'playing' ? 'Pause playback without resetting the position' : 'Play or resume from the current position') : undefined" :aria-label="takePlaying || store.srtTransportState === 'playing' ? 'Pause' : 'Play'" :disabled="liveCapture.recording || (!(takePlaying || store.srtTransportState === 'playing') && !liveCapture.events.length && !hasPlayableSource)" @click="transportPlayPause">{{ takePlaying || store.srtTransportState === 'playing' ? 'Ⅱ' : '▶' }} <span>{{ takePlaying || store.srtTransportState === 'playing' ? 'Pause' : 'Play' }}</span></button>
        <button type="button" class="tape-key" :class="{ 'tape-paused': takePaused || store.srtTransportState === 'paused' }" :title="store.tooltipsEnabled ? 'Stop recording or either playback source' : undefined" aria-label="Stop" :disabled="!liveCapture.recording && !takePlaying && store.srtTransportState !== 'playing' && store.srtTransportState !== 'paused'" @click="transportStop">■ <span>Stop</span></button>
        <button type="button" class="tape-key" title="Clear the current staff take without deleting saved files or journeys" aria-label="Clear staff take" :disabled="liveCapture.recording || (!liveCapture.events.length && !liveCapture.notes.length)" @click="clearStaffFromTransport">⌫ <span>Clear</span></button>
        <label class="transport-loop" :class="{ 'transport-loop-active': loopTake }" :title="store.tooltipsEnabled ? 'Repeat the current MIDI take continuously at the selected tempo' : undefined">
          <input v-model="loopTake" type="checkbox" aria-label="Loop current track" /> ↻ Loop
        </label>
      </div>
      <div v-if="!unifiedTransport" class="capture-settings">
        <label class="capture-option" :title="store.tooltipsEnabled ? 'Click track synchronized with the recording measure grid' : undefined"><input v-model="metronomeOn" type="checkbox" /> Metronome</label>
        <label v-if="!liveCapture.recording && !takePlaying && liveCapture.notes.length" class="review-slider">Review
          <input type="range" min="0" :max="Math.max(1, liveCapture.durationMs / (60000 / liveCapture.bpm))" step="0.1" :value="currentBeat" @input="currentBeat = Number($event.target.value)" />
        </label>
        <span class="take-stat">{{ liveCapture.notes.length }} notes · {{ (liveCapture.durationMs / 1000).toFixed(1) }}s · Recorded {{ liveCapture.bpm }} BPM<span v-if="takePlaying"> · Playback {{ store.srtTempo }} BPM ({{ (store.srtTempo / liveCapture.bpm).toFixed(2) }}×)</span></span>
        <span v-if="takeMessage" class="capture-message" role="status">{{ takeMessage }}</span>
      </div>
      <Teleport to="#unified-recording-tools" :disabled="!unifiedTransport">
      <details class="recording-tools" :open="unifiedTransport || undefined">
        <summary :title="store.tooltipsEnabled ? 'Open recording files, synchronization, and nondestructive notation cleanup' : undefined">Recording tools</summary>
        <div class="capture-files" role="group" aria-label="Recording files and staff actions">
          <button type="button" :title="store.tooltipsEnabled ? 'Load a previously exported raw MIDI JSON take' : undefined" :disabled="liveCapture.recording || takePlaying" @click="selectTakeFile">Load JSON</button>
          <input ref="takeFileInput" type="file" accept=".json,application/json" hidden @change="loadTakeFile" />
          <button type="button" :title="store.tooltipsEnabled ? 'Export original unmodified note and timing events as JSON' : undefined" :disabled="!liveCapture.events.length || liveCapture.recording || takePlaying" @click="exportLiveCapture">Export JSON</button>
          <button type="button" :title="store.tooltipsEnabled ? 'Save a selected clip from the staff' : undefined" :disabled="!hasPlayableSource || liveCapture.recording || takePlaying" @click="store.requestSrtSave">Save clip</button>
          <button type="button" :title="store.tooltipsEnabled ? 'Discard the current take and reset the recording timeline' : undefined" :disabled="!liveCapture.notes.length && !liveCapture.events.length" @click="clearCapture">Clear take</button>
        </div>
        <div class="tools-grid">
          <label class="capture-option">Audio offset (ms)
            <button type="button" class="stepper" :title="store.tooltipsEnabled ? 'Decrease playback audio lead by 25 milliseconds' : undefined" @click="stepAudioOffset(-25)">−</button>
            <input v-model.number="audioLeadMs" type="number" min="-750" max="750" step="25" class="offset-number" @change="clampAudioOffset" />
            <button type="button" class="stepper" :title="store.tooltipsEnabled ? 'Increase playback audio lead by 25 milliseconds' : undefined" @click="stepAudioOffset(25)">+</button>
          </label>
          <label class="capture-option" :title="store.tooltipsEnabled ? 'Show notes snapped toward the nearest selected grid division; original MIDI and playback remain untouched' : undefined">Notation grid
            <select v-model.number="quantizeDivision"><option :value="0">Off (verbatim)</option><option :value="1">Quarter notes</option><option :value="2">Eighth notes</option><option :value="3">Eighth triplets</option><option :value="4">Sixteenths</option></select>
          </label>
          <label v-if="quantizeDivision" class="capture-option">Cleanup strength {{ quantizeStrength }}%
            <input v-model.number="quantizeStrength" type="range" min="0" max="100" step="5" />
          </label>
        </div>
        <p class="tools-hint">Notation cleanup affects the visual preview only. Exported JSON, raw timing, and audio playback remain unchanged.</p>
      </details>
      </Teleport>
    </div>

  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ensureAudioReady, startChord, stopChordVoices, startMidi, stopMidiVoice } from '../music/audio'
import { SightReadingGenerator } from '../music/generator'
import { keyPitchClasses, midiOctave, mod12, noteName } from '../music/theory'
import { useNoteMapStore } from '../stores/noteMap'
import { liveCapture, startLiveCapture, stopLiveCapture, clearLiveCapture, exportLiveCapture, importLiveCaptureJson } from '../music/liveMidiCapture'
import { prepareCaptureMetronome, startCaptureMetronome, stopCaptureMetronome } from '../music/captureMetronome'

// Classic retains the historical transport; Unified owns the visible buttons.
const { unifiedTransport = false } = defineProps({ unifiedTransport: { type: Boolean, default: false } })

const store = useNoteMapStore()
const generator = new SightReadingGenerator()
const events = ref([])
const currentBeat = ref(0)
const readerSvg = ref(null)
const classicMetronomeOn = ref(false)
const metronomeOn = computed({
  get: () => unifiedTransport ? store.srtMetronomeOn : classicMetronomeOn.value,
  set: value => { if (unifiedTransport) store.srtMetronomeOn = !!value; else classicMetronomeOn.value = !!value }
})
// A dedicated capture layer prevents residual generated notes from appearing in takes.
const captureDisplayActive = computed(() => liveCapture.recording || liveCapture.notes.length > 0)
const quantizeDivision = ref(0)
const quantizeStrength = ref(100)
function clampAudioOffset() { audioLeadMs.value = Math.max(-750, Math.min(750, Number(audioLeadMs.value) || 0)) }
function stepAudioOffset(delta) { audioLeadMs.value += delta; clampAudioOffset() }
// Positive values advance audio relative to the score; negative values delay it.
const audioLeadMs = ref(250)
const takeFileInput = ref(null)
const takePlaying = ref(false)
const takePaused = ref(false)
// Unified uses one shared loop control; Classic retains its original per-take toggle.
const classicLoopTake = ref(false)
const loopTake = computed({
  get: () => unifiedTransport ? store.srtLoopManual : classicLoopTake.value,
  set: value => { if (unifiedTransport) store.srtLoopManual = !!value; else classicLoopTake.value = !!value }
})
const cosmicStepCount = ref(0)
let lastCosmicStep = -1
function publishCosmicPlayhead(index,playing=false) {
  if (!cosmicStepCount.value)return
  if (index===lastCosmicStep && playing)return
  lastCosmicStep=index
  window.dispatchEvent(new CustomEvent('cosmic-take-playhead',{detail:{index,playing,stepCount:cosmicStepCount.value}}))
}
function onCosmicTakeLoaded(event){cosmicStepCount.value=event.detail?.stepCount||0;lastCosmicStep=-1;publishCosmicPlayhead(0,false)}
const takeMessage = ref('')
let takeFrame = 0
let takeLastFrame = 0
let takeElapsedMs = 0
let takeIndex = 0
let takeGeneration = 0
const takeVoices = new Map()
const takeHighlightTokens = new Map()
function clearTakeHighlights() {
  for (const token of takeHighlightTokens.values()) store.endPlaying(token)
  takeHighlightTokens.clear()
}
function highlightTakeMidi(bytes) {
  const [status=0, pitch=0, velocity=0]=bytes
  const kind=status&0xf0, ch=status&0x0f, key=`${ch}:${pitch}`
  if (kind===0x90 && velocity>0) {
    const prior=takeHighlightTokens.get(key)
    if (prior!==undefined) store.endPlaying(prior)
    takeHighlightTokens.set(key,store.beginPlaying([pitch],'take-midi'))
  } else if (kind===0x80 || (kind===0x90 && velocity===0)) {
    const token=takeHighlightTokens.get(key)
    if (token!==undefined) store.endPlaying(token)
    takeHighlightTokens.delete(key)
  } else if (kind===0xb0 && (pitch===120 || pitch===123)) clearTakeHighlights()
}

// A single transport controls whichever source is active. A loaded/recorded take
// takes priority over generated/manual music until Clear take is selected.
async function transportRecord() {
  if (liveCapture.recording) return
  transportStop()
  await beginCapture()
}
async function transportPlay() {
  if (liveCapture.recording || takePlaying.value) return
  if (store.srtTransportState === 'playing') pause()
  if (liveCapture.events.length) await playTake(takePaused.value)
  else await play()
}
function transportPlayPause() {
  if (takePlaying.value || store.srtTransportState === 'playing') transportPause()
  else void transportPlay()
}
function transportPause() {
  if (takePlaying.value) pauseTake()
  else if (store.srtTransportState === 'playing') pause()
}
function transportStop() {
  if (liveCapture.recording) endCapture()
  if (takePlaying.value || takePaused.value) stopTake(true)
  if (store.srtTransportState !== 'stopped') stop()
}
function releaseTakeVoices({ preserveHighlights = false } = {}) {
  for (const voice of takeVoices.values()) if (voice && !voice.pending) stopMidiVoice(voice, 0.025)
  takeVoices.clear()
  if (!preserveHighlights) clearTakeHighlights()
}
function pauseTake() {
  if (!takePlaying.value) return
  publishCosmicPlayhead(Math.min(cosmicStepCount.value-1,Math.floor(takeElapsedMs/(60000/liveCapture.bpm*4))),false)
  ++takeGeneration
  if (takeFrame) cancelAnimationFrame(takeFrame)
  takeFrame=0
  takePlaying.value=false
  takePaused.value=true
  store.setSrtTransportState('paused')
  releaseTakeVoices({ preserveHighlights: true })
  takeMessage.value=`Paused at beat ${currentBeat.value.toFixed(1)}`
}
function stopTake(reset=false) {
  if(takePlaying.value)publishCosmicPlayhead(Math.min(cosmicStepCount.value-1,Math.floor(takeElapsedMs/(60000/liveCapture.bpm*4))),false)
  ++takeGeneration
  if (takeFrame) cancelAnimationFrame(takeFrame)
  takeFrame=0
  takePlaying.value=false
  takePaused.value=false
  store.setSrtTransportState('stopped')
  releaseTakeVoices()
  if(reset) {takeElapsedMs=0;takeIndex=0;currentBeat.value=0;lastCosmicStep=-1;publishCosmicPlayhead(0,false)}
}
function selectTakeFile() { takeFileInput.value?.click() }
async function loadTakeFile(event) {
  const file=event.target.files?.[0]
  if (!file) return
  stopTake()
  cosmicStepCount.value=0; lastCosmicStep=-1; publishCosmicPlayhead(-1,false)
  try {
    if (file.size>16000000) throw new Error('JSON file exceeds 16 MB')
    const count=importLiveCaptureJson(JSON.parse(await file.text()))
    currentBeat.value=0
    // A loaded take starts at its original tempo; the Staff BPM dial can then
    // slow down or speed up playback without modifying its raw MIDI timestamps.
    store.setSrtTempo(liveCapture.bpm)
    takeMessage.value=`Loaded ${file.name} · ${count} notes · recorded at ${liveCapture.bpm} BPM`
  } catch (error) { takeMessage.value=`Import failed: ${error.message}` }
  finally { event.target.value='' }
}
function playMidiEvent(bytes, generation) {
  highlightTakeMidi(bytes)
  const [status=0,pitch=0,velocity=0]=bytes
  const kind=status&0xf0,channel=status&0x0f,key=`${channel}:${pitch}`
  if (kind===0x90 && velocity>0) {
    const prior=takeVoices.get(key)
    if(prior && !prior.pending) stopMidiVoice(prior,0.03)
    const pending={pending:true}
    takeVoices.set(key,pending)
    startMidi(pitch, Math.max(0.02,Math.min(0.22,velocity/127*0.17))).then(voice=>{
      if(generation!==takeGeneration || takeVoices.get(key)!==pending) stopMidiVoice(voice,0.03)
      else takeVoices.set(key,voice)
    }).catch(error=>{takeMessage.value=`Playback audio: ${error.message}`;takeVoices.delete(key)})
  } else if(kind===0x80 || (kind===0x90 && velocity===0)) {
    const voice=takeVoices.get(key)
    takeVoices.delete(key)
    if(voice && !voice.pending) stopMidiVoice(voice,0.08)
  } else if(kind===0xb0 && (pitch===120 || pitch===123)) {
    for(const voice of takeVoices.values()) if(voice && !voice.pending) stopMidiVoice(voice,0.05)
    takeVoices.clear()
  }
}
async function playTake(resume=false) {
  if(liveCapture.recording || !liveCapture.events.length || takePlaying.value) return
  if(store.audioEngine==='web-midi') {takeMessage.value='Choose an internal or SoundFont instrument for take playback.';return}
  try { await ensureAudioReady() }
  catch(error) {takeMessage.value=`Audio unavailable: ${error.message}`;return}
  // Resuming preserves the timeline and next MIDI event; fresh Play starts at zero.
  if (!resume) {stopTake(true);takeIndex=0;currentBeat.value=0}
  let generation=takeGeneration
  // Keep one virtual timeline expressed in ORIGINAL take milliseconds. The Staff
  // BPM dial determines how quickly that timeline progresses in real time.
  // Accumulating delta per frame also allows tempo changes DURING playback
  // without skipping or replaying MIDI events.
  if (!resume) takeElapsedMs=0
  // Paused audio is silent, while the instrument highlights remain frozen.
  // Resume clears only that visual snapshot before processing the next MIDI event.
  if (resume) clearTakeHighlights()
  takeLastFrame=performance.now()
  takePlaying.value=true
  takePaused.value=false
  store.setSrtTransportState('playing')
  if (!resume)lastCosmicStep=-1
  takeMessage.value=`Playing at ${store.srtTempo} BPM (recorded ${liveCapture.bpm} BPM)`
  const tick=(frameNow)=>{
    if(!takePlaying.value || generation!==takeGeneration)return
    const now=Number.isFinite(frameNow)?frameNow:performance.now()
    const delta=Math.max(0,now-takeLastFrame)
    takeLastFrame=now
    takeElapsedMs+=delta*(store.srtTempo/liveCapture.bpm)
    const events=liveCapture.events
    while(takeIndex<events.length && events[takeIndex].atMs<=takeElapsedMs+audioLeadMs.value) {
      playMidiEvent(events[takeIndex].bytes,generation)
      ++takeIndex
    }
    currentBeat.value=Math.min(takeElapsedMs,liveCapture.durationMs)/(60000/liveCapture.bpm)
    if(cosmicStepCount.value)publishCosmicPlayhead(Math.min(cosmicStepCount.value-1,Math.floor(takeElapsedMs/(60000/liveCapture.bpm*4))),true)
    if(takeElapsedMs>=liveCapture.durationMs && takeIndex>=events.length){
      if(loopTake.value && liveCapture.durationMs>0){
        // Invalidate pending asynchronous voice starts from the previous pass.
        ++takeGeneration
        generation=takeGeneration
        releaseTakeVoices()
        takeIndex=0
        lastCosmicStep=-1
        // Preserve the overshoot so the grid stays in time across repeat boundaries.
        takeElapsedMs=takeElapsedMs%liveCapture.durationMs
        currentBeat.value=takeElapsedMs/(60000/liveCapture.bpm)
        takeMessage.value=`Looping at ${store.srtTempo} BPM (recorded ${liveCapture.bpm} BPM)`
      } else {
        stopTake(true)
        takeMessage.value='Take playback complete'
        return
      }
    }
    takeFrame=requestAnimationFrame(tick)
  }
  takeFrame=requestAnimationFrame(tick)
}
const dropPreview = ref(null)
const scanX = 560
const pixelsPerBeat = computed(() => 126 * store.staffZoom)
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
const hasPlayableSource = computed(() => store.srtSource === 'generated' || store.hasStaffSequence)
const canSaveSelection = computed(() => store.clipSelectionStart !== null && store.clipSelectionEnd !== null && selectedEvents.value.some((event) => event.midis?.length))
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
// Preview is deliberately unquantized. Raw MIDI note-on time determines x;
// meter grid is currently 4/4 at the tempo captured when Record was pressed.
const capturedVisualEvents = computed(() => {
  // The raw performance remains untouched. Only its label layout is adjusted.
  const visible = liveCapture.notes.map((note, index) => {
    const rawBeat = note.atMs / (60000 / liveCapture.bpm)
    const grid = quantizeDivision.value
    const snapped = grid ? Math.round(rawBeat * grid) / grid : rawBeat
    const beat = rawBeat + (snapped - rawBeat) * (grid ? quantizeStrength.value / 100 : 0)
    const clef = note.midi < 60 ? 'bass' : 'treble'
    const y = noteY(note.midi, clef)
    const x = xForBeat(beat)
    return { id: `live-${index}`, notes: [{ midi: note.midi, x, y, clef, accidental: accidentalForMidi(note.midi), ledgerLines: ledgerLines(y, clef), label: displayLabelForMidi(note.midi), labelX: x+16, labelY: y+5 }] }
  }).filter(e => e.notes[0].x > -50 && e.notes[0].x < 1150)
  // Dense chord labels need collision avoidance. Within each clef and x-column,
  // space labels at least 15 pixels apart; a fine guide identifies the notehead.
  const groups = new Map()
  for (const event of visible) {
    const n=event.notes[0]
    const key = n.clef + ':' + Math.round(n.x/35)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(n)
  }
  for (const notes of groups.values()) {
    notes.sort((a,b)=>a.y-b.y)
    const minSpacing=16
    for (let i=1;i<notes.length;i++) {
      if (notes[i].labelY < notes[i-1].labelY+minSpacing) notes[i].labelY=notes[i-1].labelY+minSpacing
    }
    // Avoid shifting the whole group systematically down.
    const averageShift=notes.reduce((sum,n)=>sum+n.labelY-(n.y+5),0)/notes.length
    for (const n of notes) n.labelY -= averageShift
  }
  return visible
})
async function beginCapture() {
  stopTake()
  // Discard pre-existing generated staff events instead of merely masking them.
  clearReleaseTimers()
  events.value = []
  if (store.srtTransportState === 'playing') pause()
  // Prewarm the audio context on the user's click before starting the take.
  if (metronomeOn.value) {
    // AudioContext resume is user-gesture gated. See captureMetronome.
    try { await prepareCaptureMetronome() } catch (error) { console.warn('Metronome unavailable', error) }
  }
  startLiveCapture(store.srtTempo)
  store.srtRecording = true
  currentBeat.value = 0
  if (metronomeOn.value) startCaptureMetronome(liveCapture.startedAt, liveCapture.bpm).catch(console.warn)
  startCaptureTicker()
}
function endCapture() {
  stopLiveCapture()
  store.srtRecording = false
  stopCaptureMetronome()
  stopCaptureTicker()
}
function clearStaffFromTransport() {
  clearCapture()
}
function clearCapture() {
  store.srtRecording = false
  stopTake()
  takeMessage.value=''
  stopCaptureMetronome()
  stopCaptureTicker()
  clearLiveCapture()
  currentBeat.value = 0
}
let captureFrame = 0
function startCaptureTicker() {
  if (captureFrame) window.cancelAnimationFrame(captureFrame)
  const frame = () => {
    if (!liveCapture.recording) return
    liveCapture.durationMs = Math.max(liveCapture.durationMs, performance.now() - liveCapture.startedAt)
    currentBeat.value = liveCapture.durationMs / (60000 / liveCapture.bpm)
    captureFrame = window.requestAnimationFrame(frame)
  }
  captureFrame = window.requestAnimationFrame(frame)
}
function stopCaptureTicker() {
  if (captureFrame) window.cancelAnimationFrame(captureFrame)
  captureFrame = 0
}
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
      const arch = note.clef === 'treble' ? -18 : 18
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
  const bass = signature > 0 ? [249, 270, 242, 263, 284, 256, 277] : [277, 256, 284, 263, 291, 270, 298]
  return Array.from({ length: count }, (_, index) => [
    { clef: 'treble', index, x: 93 + index * 17, y: treble[index], char },
    { clef: 'bass', index, x: 93 + index * 17, y: bass[index], char }
  ]).flat()
})

function mod4(value) { return ((value % 4) + 4) % 4 }
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
function diatonicIndex(midi) {
  const spelling = spellingForMidi(midi)
  const octave = midiOctave(midi)
  return octave * 7 + letterOrder.indexOf(String(spelling)[0])
}

// The scrolling reader deliberately leaves a large visual gap between the two
// staves, so a single continuous Y mapping cannot be musically correct for both
// clefs. Anchor each clef to its actual bottom staff line instead:
//   treble bottom line = E4 at y=134
//   bass bottom line   = G2 at y=284
const trebleBottomLineIndex = 4 * 7 + letterOrder.indexOf('E')
const bassBottomLineIndex = 2 * 7 + letterOrder.indexOf('G')
function noteY(midi, clef = 'treble') {
  const index = diatonicIndex(midi)
  return clef === 'bass'
    ? 284 - (index - bassBottomLineIndex) * 7
    : 134 - (index - trebleBottomLineIndex) * 7
}
function clefForPointerY(y) { return y < 181 ? 'treble' : 'bass' }
function clefForEventMidi(event, midi) {
  if (event?.clef === 'treble' || event?.clef === 'bass') return event.clef
  // Combined/generated and manual events need a deterministic split. Middle C
  // defaults to treble; lower notes default to bass.
  return Number(midi) >= 60 ? 'treble' : 'bass'
}
function ledgerLines(y, clef) {
  const values = []
  if (clef === 'bass') {
    for (let line = 214; line >= y; line -= 14) values.push(line)
    for (let line = 298; line <= y; line += 14) values.push(line)
  } else {
    for (let line = 64; line >= y; line -= 14) values.push(line)
    for (let line = 148; line <= y; line += 14) values.push(line)
  }
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
    y: (event.clientY - rect.top) / rect.height * 380
  }
}
function nearestMidiForPitchClass(pitchClass, y) {
  const clef = clefForPointerY(y)
  let bestMidi = 60 + mod12(pitchClass)
  let bestDistance = Infinity
  for (let midi = 24; midi <= 96; midi += 1) {
    if (mod12(midi) !== mod12(pitchClass)) continue
    const distance = Math.abs(noteY(midi, clef) - y)
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
  const midis = previewNotesForPayload(payload, Math.max(48, Math.min(330, point.y)))
  if (!midis.length) return
  const beat = localManualBeat(absoluteBeat)
  const x = xForBeat(currentManualCycleStart() + beat)
  dropPreview.value = {
    x,
    beat,
    width: payload.type === 'clip' ? Math.max(18, clipLengthBeats(payload) * pixelsPerBeat.value) : 0,
    beatLabel: String(Math.round(beat / store.staffQuantize) * store.staffQuantize + 1),
    label: payload.type === 'clip' ? (payload.label || 'Clip') : payload.type === 'chord' ? (payload.label || 'Chord') : displayLabelForMidi(midis[0]),
    notes: midis.map((midi) => {
      const clef = clefForPointerY(point.y)
      const y = noteY(midi, clef)
      return {
        midi,
        x,
        y,
        clef,
        accidental: accidentalForMidi(midi),
        ledgerLines: ledgerLines(y, clef)
      }
    })
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
  const clef = clefForPointerY(y)
  for (let shift = -48; shift <= 48; shift += 12) {
    const candidate = source.map((midi) => midi + shift)
    if (candidate.some((midi) => midi < 24 || midi > 96)) continue
    const averageY = candidate.reduce((sum, midi) => sum + noteY(midi, clef), 0) / candidate.length
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
    const clef = clefForEventMidi(event, midi)
    const y = noteY(midi, clef)
    if (previousY !== null && Math.abs(previousY - y) <= 8) alternate = !alternate
    else alternate = false
    previousY = y
    const x = baseX + (alternate ? 8 : 0)
    return {
      midi,
      x,
      y,
      clef,
      label: displayLabelForMidi(midi),
      accidental: accidentalForMidi(midi),
      ledgerLines: ledgerLines(y, clef)
    }
  })

  const groups = [
    rawNotes.filter((note) => note.clef === 'treble').sort((a, b) => a.y - b.y),
    rawNotes.filter((note) => note.clef === 'bass').sort((a, b) => a.y - b.y)
  ]
  for (const group of groups) {
    group.forEach((note, index) => {
      const placeRight = index % 2 === 1
      note.labelX = note.x + (placeRight ? 17 : -17)
      note.labelY = note.y + 5
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
    chordSizes: store.srtChordSizes,
    leftHandSizes: store.srtLeftHandSizes,
    rightHandSizes: store.srtRightHandSizes,
    bassPattern: store.srtBassPattern,
    exerciseMode: store.srtExerciseMode,
    progression: store.srtProgression,
    riffFlavor: store.srtRiffFlavor,
    dynamics: store.srtDynamics,
    trebleRegions: store.srtTrebleRegions,
    bassRegions: store.srtBassRegions
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
  if (liveCapture.recording || liveCapture.notes.length || liveCapture.events.length) return
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
function clearReleaseTimers({ preserveHighlights = false } = {}) {
  releaseTimers.forEach((timer) => window.clearTimeout(timer))
  releaseTimers = []
  activeVoiceGroups.forEach((group) => { group.cancelled = true; stopChordVoices(group.voices, 0.05) })
  activeVoiceGroups = []
  if (!preserveHighlights) store.clearPlaying('srt')
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
  // MIDI capture must never create generated notes in the background.
  // Populate generated/manual events only if staff playback is explicitly started.
}
function cancelAnimation() {
  if (animationFrame) window.cancelAnimationFrame(animationFrame)
  animationFrame = 0
}
async function play() {
  if (!hasPlayableSource.value || store.srtTransportState === 'playing' || liveCapture.recording) return
  if (!events.value.length) fillAhead()
  const token = ++sessionToken
  await ensureAudioReady()
  if (token !== sessionToken) return
  store.clearPlaying('srt') // discard the frozen visual snapshot on resume
  store.setSrtTransportState('playing')
  const beatMs = 60000 / store.srtTempo
  startedAt = performance.now() - currentBeat.value * beatMs
  previousBeat = currentBeat.value - 0.001
  tick(performance.now())
}
function freezeTransport(state) {
  sessionToken += 1
  cancelAnimation()
  clearReleaseTimers({ preserveHighlights: state === 'paused' })
  previousBeat = currentBeat.value
  store.setSrtTransportState(state)
}
function pause() {
  freezeTransport('paused')
}
function stop() {
  freezeTransport('stopped')
}
function regenerate() {
  if (liveCapture.recording || liveCapture.notes.length || liveCapture.events.length) return
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
      const audibleMidis = event.midis.filter((midi) => {
        const clef = clefForEventMidi(event, midi)
        return clef === 'treble' ? store.srtTrebleAudio : store.srtBassAudio
      })
      if (!audibleMidis.length) continue
      // Gate/hold is deliberately evaluated at the instant of playback rather
      // than baked into generated events. The lower floor preserves short notes
      // instead of collapsing all low Hold settings into the same 240 ms blip.
      const holdSeconds = Math.max(0.075, event.duration * store.srtGate * beatMs / 1000)
      const releaseSeconds = Math.min(0.22, Math.max(0.07, holdSeconds * 0.16))
      const token = store.beginPlaying(audibleMidis, 'srt')
      const group = { token, voices: [], cancelled: false }
      activeVoiceGroups.push(group)
      startChord(audibleMidis, event.velocity || (audibleMidis.length > 1 ? 0.095 : 0.16)).then((voices) => {
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

function saveFromTransport() {
  let sourceEvents = []
  let start = 0

  if (canSaveSelection.value) {
    sourceEvents = selectedEvents.value
    start = store.clipSelectionStart
  } else if (store.srtSource === 'staff') {
    sourceEvents = store.staffClusters.map((cluster) => ({
      beat: cluster.beat,
      duration: cluster.duration,
      midis: cluster.events.map((event) => event.midi)
    }))
    start = sourceEvents.length ? Math.min(...sourceEvents.map((event) => event.beat)) : 0
  } else {
    sourceEvents = visibleEvents.value
      .map((item) => item.rawEvent || item)
      .filter((event) => !event.isRest && event.midis?.length)
    start = sourceEvents.length ? Math.min(...sourceEvents.map((event) => event.beat)) : 0
  }

  if (!sourceEvents.length) return
  const normalized = sourceEvents.map((event) => ({
    beat: event.beat - start,
    duration: event.duration,
    midis: event.midis
  }))
  store.saveClip({ name: `Clip ${store.clips.length + 1}`, events: normalized })
  store.clearClipSelection()
}



watch(() => store.srtTransportNonce, () => {
  // Always pass through the same transport used by the Classic staff controls.
  // Direct play()/pause()/stop() bypasses recorded takes and Cosmic playheads.
  if (store.srtTransportCommand === 'play' || store.srtTransportCommand === 'start') void transportPlay()
  else if (store.srtTransportCommand === 'pause') transportPause()
  else if (store.srtTransportCommand === 'record') void transportRecord()
  else if (store.srtTransportCommand === 'clear') clearStaffFromTransport()
  else if (store.srtTransportCommand === 'save') saveFromTransport()
  else transportStop()
}, { flush: 'sync' })
watch(() => store.srtGenerationNonce, regenerate)
watch(() => liveCapture.take, () => { if(!liveCapture.recording) currentBeat.value=0 })
watch(() => store.srtTempo, rebaseTempoClock)
watch(() => store.staffEvents.map((event) => `${event.id}:${event.beat}:${event.duration}:${event.midi}`).join('|'), refreshManualEvents)
watch(() => store.srtLoopManual, () => { if (store.srtSource === 'staff') regenerate() })
watch(() => store.activeTab, (tab) => { if (tab !== 'note-map' && store.srtTransportState === 'playing') transportPause() })
function focusCosmicStep(event){if(liveCapture.recording || takePlaying.value || !liveCapture.notes.length || !cosmicStepCount.value)return;const index=event.detail?.index;if(!Number.isInteger(index)||index<0||index>=cosmicStepCount.value)return;currentBeat.value=index*4;publishCosmicPlayhead(index,false)}
onMounted(() => { prepareSession(); store.setSrtTransportState('stopped');window.addEventListener('cosmic-review-step',focusCosmicStep);window.addEventListener('cosmic-take-loaded',onCosmicTakeLoaded) })
onBeforeUnmount(() => { window.removeEventListener('cosmic-review-step',focusCosmicStep);window.removeEventListener('cosmic-take-loaded',onCosmicTakeLoaded); stopTake(); stopCaptureMetronome(); stopCaptureTicker(); stopLiveCapture(); store.srtRecording = false; sessionToken += 1; cancelAnimation(); clearReleaseTimers(); store.setSrtTransportState('stopped') })
</script>

<style scoped>
.recording-console--unified { padding-top: 0; }
.srt-shell { display: grid; gap: 10px; width: 100%; margin: 0; padding: 2px; color: white; }
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


.recording-console { background:#203643; border-radius:8px; padding:9px 12px; display:flex; flex-direction:column; align-items:center; gap:9px; }
.tape-deck { display:flex; flex-wrap:wrap; justify-content:center; align-items:center; gap:8px; width:100%; }
.tape-key { min-width:91px; min-height:44px; border:1px solid #7790a5; border-radius:7px; background:#273d53; color:#edf7ff; font-size:18px; cursor:pointer; }
.tape-key span { font-size:13px; margin-left:5px; }
.record-key { color:#ffb2b2; }
.tape-key:disabled { opacity:.38; cursor:not-allowed; }
.tape-key:hover:not(:disabled) { background:#385c79; }
.transport-loop { display:inline-flex; align-items:center; justify-content:center; min-width:96px; min-height:40px; margin-left:12px; padding:4px 10px; border:1px solid #7790a5; border-radius:7px; background:#25384e; color:#d0e2ee; font-size:13px; cursor:pointer; white-space:nowrap; }
.transport-loop input { accent-color:#ffd17d; margin-right:6px; }
.transport-loop-active { border-color:#ffd17d; background:#4e4432; color:#ffe4ac; }
.recording-tools { width:100%; max-width:890px; border-top:1px solid #445f73; padding:4px 8px 1px; }
.recording-tools summary { cursor:pointer; text-align:center; color:#cbe4f5; font-size:12px; padding:5px; user-select:none; }
.tools-grid { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; align-items:center; margin:9px 0; }
.tools-grid select,.offset-number { background:#182b3b; border:1px solid #6d96ae; border-radius:5px; color:white; padding:5px; }
.offset-number { width:64px; text-align:center; appearance:textfield; -moz-appearance:textfield; }
.offset-number::-webkit-inner-spin-button,.offset-number::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
.stepper { background:#315470; border:1px solid #6d96ae; border-radius:5px; color:white; padding:5px 10px; cursor:pointer; }
.tools-hint { font-size:11px; color:#aecadb; text-align:center; margin:6px 0; }
.capture-files { display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:7px; padding-top:8px; width:100%; }
.capture-files button { background:#315470; border:1px solid #6d96ae; color:white; padding:6px 9px; border-radius:5px; cursor:pointer; font-size:12px; }
.capture-files button:disabled { opacity:.4; cursor:default; }
.action-caption { font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:#a7c0d0; margin-right:5px; }
.capture-settings { display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:10px; font-size:12px; }
.take-stat { color:#c4dbe9; }

.capture-label-guide { stroke: #bfeaff; stroke-width: 0.8; opacity: .75; fill: none; pointer-events: none; }
.capture-head { fill: #5be1c0; stroke: #ffffff; stroke-width: 1.3; }
.capture-label { fill: #bfeaff; font-size: 13px; font-weight: 600; paint-order: stroke; stroke: #202020; stroke-width: 3px; text-anchor: start; dominant-baseline: central; }
.capture-option { display:inline-flex; align-items:center; gap:4px; cursor:pointer; }
.capture-option input[type="range"] { width:90px; }
.capture-bar { display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:9px; font-size:12px; padding:7px; background:#203643; border-radius:7px; }
.capture-bar button { background:#315470; border:1px solid #6d96ae; color:white; padding:6px 9px; border-radius:5px; cursor:pointer; }
.capture-bar button:disabled { opacity:.4; cursor:default; }
.review-slider { display:flex; align-items:center; gap:6px; }
.review-slider input { width:130px; }
@media (max-width: 700px) { .srt-shell { padding-inline: 0; } }
</style>
