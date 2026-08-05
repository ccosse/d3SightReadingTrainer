<template>
  <section class="srt-shell">
    <div class="srt-controls">
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
        v-if="['walking-chords', 'stride', 'jazz-guitar'].includes(store.srtStyle)"
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

      <div class="tempo-block">
        <span>{{ store.srtTempo }} BPM</span>
        <q-slider :model-value="store.srtTempo" :min="30" :max="180" :step="1" color="positive" @update:model-value="store.setSrtTempo">
          <q-tooltip>Tempo controls scrolling and held-note playback.</q-tooltip>
        </q-slider>
      </div>

      <div class="gate-block">
        <span>Hold {{ Math.round(store.srtGate * 100) }}%</span>
        <q-slider :model-value="store.srtGate" :min="0.35" :max="1.2" :step="0.05" color="amber-6" @update:model-value="store.setSrtGate">
          <q-tooltip>Gate length for the next sounding event. At 100%, a one-beat note is held for one full beat; values above 100% overlap into the next event.</q-tooltip>
        </q-slider>
      </div>

      <div class="swing-block">
        <span>Swing {{ Math.round(store.srtSwing * 100) }}%</span>
        <q-slider :model-value="store.srtSwing" :min="0" :max="0.45" :step="0.05" color="pink-4" @update:model-value="store.setSrtSwing">
          <q-tooltip>Delays every second generated pulse to create a long-short feel. With ½-beat events this becomes conventional eighth-note swing; it also remains audible with beat-based accompaniment styles.</q-tooltip>
        </q-slider>
      </div>

      <q-toggle v-model="store.srtShowLabels" color="light-blue-5" label="Labels" />
      <q-toggle v-if="store.srtSource === 'staff'" v-model="store.srtLoopManual" color="light-blue-5" label="Loop" />
      <q-btn flat icon="refresh" color="grey-3" :disable="store.srtSource === 'staff'" @click="regenerate"><q-tooltip>Regenerate the future passage.</q-tooltip></q-btn>
    </div>

    <div class="srt-hud">
      <span><strong>{{ store.currentMode === 'minor' ? store.currentMinorLabel : store.currentKey.label + ' major' }}</strong> · {{ store.keySignatureSummary }}</span>
      <span>{{ sourceSummary }}</span>
      <span class="gold-copy">gold = currently sounding on staff, piano, and guitar</span>
    </div>

    <div class="scroll-stage">
      <svg
        ref="readerSvg"
        class="scroll-svg"
        viewBox="0 0 1120 360"
        role="img"
        aria-label="Common scrolling grand staff with fixed scanline, clip selection, and linked instrument playback"
        @pointerdown="beginRangeSelection"
        @pointermove="updateRangeSelection"
        @pointerup="finishRangeSelection"
        @pointercancel="cancelRangeSelection"
        @pointerleave="finishRangeSelection"
      >
        <rect x="0" y="0" width="1120" height="360" class="stage-bg" />

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

        <g v-for="event in visibleEvents" :key="event.id" class="scroll-event" :class="{ crossing: event.crossing }">
          <line v-if="event.stem" :x1="event.stem.x" :x2="event.stem.x" :y1="event.stem.y1" :y2="event.stem.y2" class="note-stem" />
          <g v-for="note in event.notes" :key="`${event.id}-${note.midi}`">
            <line v-for="ledgerY in note.ledgerLines" :key="ledgerY" :x1="note.x - 16" :x2="note.x + 16" :y1="ledgerY" :y2="ledgerY" class="ledger-line" />
            <ellipse :cx="note.x" :cy="note.y" rx="10" ry="7" :transform="`rotate(-18 ${note.x} ${note.y})`" class="scroll-head" />
            <text v-if="store.srtShowLabels" :x="note.x" :y="note.y - 14" text-anchor="middle" class="scroll-label">{{ note.label }}</text>
          </g>
        </g>

        <rect v-if="selectionVisual" :x="selectionVisual.x" y="42" :width="selectionVisual.width" height="274" class="clip-selection" />
        <line :x1="scanX" :x2="scanX" y1="34" y2="318" class="fixed-scanline" />
        <polygon :points="`${scanX - 7},34 ${scanX + 7},34 ${scanX},46`" class="scan-marker" />
        <text :x="scanX" y="342" text-anchor="middle" class="scan-caption">PLAY</text>
      </svg>
    </div>

    <div class="clip-toolbar">
      <div class="zoom-control">
        <span>{{ visibleBars }} visible bars</span>
        <q-slider :model-value="store.staffZoom" :min="0.55" :max="1.6" :step="0.05" color="primary" @update:model-value="store.setStaffZoom">
          <q-tooltip>Zoom out to show more measures without shrinking staff symbols.</q-tooltip>
        </q-slider>
      </div>
      <q-input v-model="clipName" dark outlined dense label="Clip name" />
      <q-btn outline color="amber-5" icon="content_cut" label="Save selected region" no-caps :disable="!canSaveSelection" @click="saveSelection" />
      <q-btn outline color="light-blue-3" icon="playlist_add" label="Next 2 bars → staff" no-caps :disable="store.srtSource !== 'generated' || !events.length" @click="captureToStaff" />
      <q-btn v-if="store.clipSelectionStart !== null" flat color="grey-4" icon="deselect" @click="store.clearClipSelection"><q-tooltip>Clear the selected time region.</q-tooltip></q-btn>
    </div>

    <div v-if="store.clips.length" class="clip-library">
      <div class="clip-library-title">Clip library</div>
      <div v-for="clip in store.clips" :key="clip.id" class="clip-row">
        <div><strong>{{ clip.name }}</strong><span>{{ clip.events.length }} events · {{ clip.tempo }} BPM</span></div>
        <q-btn flat color="light-blue-3" icon="edit_note" @click="store.loadClipToStaff(clip.id)"><q-tooltip>Load this clip into the editable staff.</q-tooltip></q-btn>
        <q-btn flat color="negative" icon="delete" @click="store.removeClip(clip.id)"><q-tooltip>Delete this saved clip.</q-tooltip></q-btn>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ensureAudioReady, playChord } from '../music/audio'
import { SIGHT_READING_OPTIONS, SightReadingGenerator } from '../music/generator'
import { midiLabel, mod12 } from '../music/theory'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const options = SIGHT_READING_OPTIONS
const generator = new SightReadingGenerator()
const events = ref([])
const currentBeat = ref(0)
const readerSvg = ref(null)
const clipName = ref('')
const scanX = 560
const pixelsPerBeat = computed(() => 126 * store.staffZoom)
const visibleBars = computed(() => Math.max(1, Math.round((1120 / pixelsPerBeat.value) / 4)))
const leadInBeats = 4
const horizonBeats = 28
const historyBeats = 64
const staffLines = [78, 92, 106, 120, 134, 228, 242, 256, 270, 284]
const letterOrder = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const pitchLetterSharp = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B']
const pitchLetterFlat = ['C', 'D', 'D', 'E', 'E', 'F', 'G', 'G', 'A', 'A', 'B', 'B']
let animationFrame = 0
let startedAt = 0
let previousBeat = 0
let nextGeneratedBeat = leadInBeats
let nextManualCycleBeat = leadInBeats
let playedIds = new Set()
let releaseTimers = []
let sessionToken = 0
let selecting = false
let selectionAnchor = null
let generatedPulseIndex = 0

const accompanimentStyle = computed(() => ['walking-chords', 'stride', 'jazz-guitar'].includes(store.srtStyle))
const effectiveSpacing = computed(() => accompanimentStyle.value ? 1 : store.srtEventSpacing)
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
const visibleEvents = computed(() => events.value.map(buildVisualEvent).filter((event) => event.x > -90 && event.x < 1210))
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
function setOption(name, value) { store.setSrtOption(name, value) }
function diatonicStepFromC4(midi) {
  const pc = mod12(midi)
  const octave = Math.floor(midi / 12) - 1
  const letters = store.accidentalMode === 'flat' ? pitchLetterFlat : pitchLetterSharp
  return (octave - 4) * 7 + letterOrder.indexOf(letters[pc])
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
function buildVisualEvent(event) {
  const playBeat = playbackBeatForEvent(event)
  const baseX = xForBeat(playBeat)
  let previousY = null
  let alternate = false
  const notes = event.midis.map((midi) => {
    const y = noteY(midi)
    if (previousY !== null && Math.abs(previousY - y) <= 8) alternate = !alternate
    else alternate = false
    previousY = y
    const x = baseX + (alternate ? 8 : 0)
    return { midi, x, y, label: midiLabel(midi, store.accidentalMode), ledgerLines: ledgerLines(y) }
  })
  const ys = notes.map((note) => note.y)
  const minY = ys.length ? Math.min(...ys) : 181
  const maxY = ys.length ? Math.max(...ys) : 181
  const meanY = ys.length ? ys.reduce((sum, value) => sum + value, 0) / ys.length : 181
  const stem = notes.length ? (meanY >= 181 ? { x: baseX + 10, y1: maxY, y2: Math.max(49, minY - 34) } : { x: baseX - 10, y1: minY, y2: Math.min(313, maxY + 34) }) : null
  return { ...event, playBeat, x: baseX, notes, stem, crossing: Math.abs(baseX - scanX) < 13 }
}
function generatedEvent() {
  const pulseIndex = generatedPulseIndex
  generatedPulseIndex += 1
  return {
    ...generator.generate({
      key: store.compositionKey,
      beat: nextGeneratedBeat,
      // Duration is the written/nominal duration. Hold is applied live at playback,
      // so moving the Hold slider affects the very next note without regenerating.
      duration: Math.max(0.25, effectiveSpacing.value),
      material: store.srtMaterial,
      motion: store.srtMotion,
      clefMode: store.srtClefMode,
      rangeName: store.srtRange,
      style: store.srtStyle,
      chordSize: store.srtChordSize,
      bassPattern: store.srtBassPattern,
      exerciseMode: store.srtExerciseMode
    }),
    swingIndex: pulseIndex,
    swingUnit: effectiveSpacing.value
  }
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
function clearReleaseTimers() { releaseTimers.forEach((timer) => window.clearTimeout(timer)); releaseTimers = []; store.clearPlaying('srt') }
function prepareSession() {
  clearReleaseTimers()
  events.value = []
  currentBeat.value = 0
  previousBeat = 0
  nextGeneratedBeat = leadInBeats
  nextManualCycleBeat = leadInBeats
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
  previousBeat = currentBeat.value
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
      // Gate/hold is deliberately evaluated at the instant of playback rather
      // than baked into generated events. The lower floor preserves short notes
      // instead of collapsing all low Hold settings into the same 240 ms blip.
      const seconds = Math.max(0.055, event.duration * store.srtGate * beatMs / 1000)
      const token = store.beginPlaying(event.midis, 'srt')
      playChord(event.midis, seconds, event.midis.length > 1 ? 0.095 : 0.16)
      releaseTimers.push(window.setTimeout(() => store.endPlaying(token), seconds * 1000))
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
watch(() => store.staffEvents.map((event) => `${event.id}:${event.beat}:${event.duration}:${event.midi}`).join('|'), () => { if (store.srtSource === 'staff') regenerate() })
watch(() => store.srtLoopManual, () => { if (store.srtSource === 'staff') regenerate() })
watch(() => store.activeTab, (tab) => { if (tab !== 'note-map' && store.srtTransportState === 'playing') pause() })
onMounted(() => { prepareSession(); store.setSrtTransportState('stopped') })
onBeforeUnmount(() => { sessionToken += 1; cancelAnimation(); clearReleaseTimers(); store.setSrtTransportState('stopped') })
</script>

<style scoped>
.srt-shell { display: grid; gap: 12px; width: 100%; margin: 0; padding: 2px; color: white; }
.srt-controls { display: grid; grid-template-columns: repeat(6, minmax(145px, 1fr)); gap: 9px; align-items: center; padding: 10px; border: 1px solid rgba(255,255,255,.18); border-radius: 10px; background: rgba(35,35,35,.88); }
.srt-controls :deep(.q-field__label), .srt-controls :deep(.q-field__native), .srt-controls :deep(.q-toggle__label) { font-size: 17px; }
.tempo-block, .gate-block, .swing-block, .zoom-control { display: grid; grid-template-columns: auto minmax(115px, 1fr); gap: 9px; align-items: center; color: #8dffab; font-size: 17px; white-space: nowrap; }
.gate-block { color: #ffd866; }
.swing-block { color: #ff9fd4; }
.srt-hud { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px 20px; padding: 8px 11px; border: 1px solid rgba(255,255,255,.13); border-radius: 7px; background: rgba(35,35,35,.62); color: #e0e0e0; font-size: 17px; }
.gold-copy { color: #ffd866; }
.scroll-stage { overflow: hidden; border: 1px solid rgba(255,255,255,.18); border-radius: 10px; background: #202020; }
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
.scroll-label { fill: #bfeaff; font-size: 18px; font-weight: 650; }
.fixed-scanline { stroke: #ff5a5a; stroke-width: 2.6; filter: drop-shadow(0 0 5px rgba(255,90,90,.9)); }
.scan-marker { fill: #ff5a5a; }
.scan-caption { fill: #ffaaaa; font-size: 16px; letter-spacing: .13em; }
.clip-selection { fill: rgba(215,169,40,.16); stroke: #ffd866; stroke-width: 1.5; stroke-dasharray: 6 4; pointer-events: none; }
.empty-state text { fill: #ddd; font-size: 24px; }
.empty-state .empty-sub { fill: #aaa; font-size: 18px; }
.clip-toolbar { display: grid; grid-template-columns: minmax(230px,1fr) minmax(170px,.6fr) auto auto auto; gap: 10px; align-items: center; padding: 9px; border: 1px solid rgba(255,255,255,.13); border-radius: 8px; background: rgba(35,35,35,.62); }
.clip-toolbar :deep(.q-field__label), .clip-toolbar :deep(.q-field__native), .clip-toolbar :deep(.q-btn__content) { font-size: 16px; }
.clip-library { display: grid; gap: 6px; border-top: 1px solid rgba(255,255,255,.15); padding-top: 8px; }
.clip-library-title { font-size: 20px; font-weight: 650; color: #ffd866; }
.clip-row { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; align-items: center; padding: 7px 9px; border-radius: 7px; background: rgba(30,30,30,.75); }
.clip-row strong { font-size: 18px; }
.clip-row span { display: block; color: #bbb; font-size: 15px; }
@media (max-width: 1200px) { .srt-controls { grid-template-columns: repeat(3, minmax(150px,1fr)); } .clip-toolbar { grid-template-columns: 1fr 1fr; } }
@media (max-width: 700px) { .srt-shell { padding-inline: 0; } .srt-controls { grid-template-columns: 1fr; } .srt-controls > * { grid-column: 1; } .tempo-block, .gate-block, .swing-block { grid-column: 1; } .clip-toolbar { grid-template-columns: 1fr; } }
</style>
