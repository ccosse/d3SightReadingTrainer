<template>
  <q-page class="unified-page">
    <!-- One bridge instance handles the same BroadcastChannel and Pinia state
         as Classic. The iframe below is only a different view of Cosmic Harmony. -->
    <div class="unified-toolbar">
      <q-btn dense flat round icon="menu" aria-label="Toggle workspace controls" @click="leftOpen = !leftOpen">
        <q-tooltip v-if="store.tooltipsEnabled">{{ leftOpen ? 'Hide' : 'Show' }} workspace controls</q-tooltip>
      </q-btn>
      <strong class="unified-heading">Unified</strong>
      <div class="unified-key">{{ store.currentKey.label }} · {{ store.currentMode }}</div>
      <q-space />
      <q-btn dense flat round icon="fiber_manual_record" color="red-5" :disable="store.srtRecording" aria-label="Record MIDI take" @click="store.requestSrtRecord()" />
      <q-badge v-if="store.srtRecording" color="negative" label="REC" />
      <q-btn dense flat round :icon="store.srtTransportState === 'playing' ? 'pause' : 'play_arrow'" :aria-label="store.srtTransportState === 'playing' ? 'Pause' : 'Play'" :disable="store.srtRecording" @click="toggleTransport" />
      <q-btn dense flat round icon="stop" aria-label="Stop recording or playback" @click="store.requestSrtStop()" />
      <q-btn dense flat round icon="backspace" aria-label="Clear current staff take" @click="store.requestSrtClear()" />
      <q-btn dense flat round icon="settings_input_component" :color="recordingToolsOpen ? 'primary' : 'grey-5'"
        aria-label="Toggle Recording tools" aria-controls="unified-recording-tools"
        :aria-expanded="recordingToolsOpen" @click="recordingToolsOpen = !recordingToolsOpen">
        <q-tooltip v-if="store.tooltipsEnabled">Recording files, audio offset and notation cleanup</q-tooltip>
      </q-btn>
      <q-btn dense flat round icon="repeat" :color="store.srtLoopManual ? 'primary' : 'grey-5'" aria-label="Toggle looping" @click="store.srtLoopManual = !store.srtLoopManual" />
      <q-checkbox dense dark v-model="store.srtMetronomeOn" label="Click" title="Metronome during MIDI recording" />
      <q-input
        class="unified-tempo" dark dense outlined type="number" label="BPM"
        :model-value="store.srtTempo" min="30" max="220" aria-label="Tempo in beats per minute"
        @update:model-value="store.setSrtTempo($event)"
      />
      <q-btn dense flat round :icon="rightOpen ? 'chevron_right' : 'chevron_left'" aria-label="Toggle Circle of Fifths sidebar" @click="rightOpen = !rightOpen">
        <q-tooltip v-if="store.tooltipsEnabled">{{ rightOpen ? 'Hide' : 'Show' }} Circle of Fifths</q-tooltip>
      </q-btn>
      <q-btn dense flat icon="open_in_new" label="Classic" :to="'/'" />
      <div v-show="recordingToolsOpen" id="unified-recording-tools" class="unified-recording-popover" role="region" aria-label="Recording tools">
        <div class="unified-recording-title"><strong>Recording tools</strong>
          <q-btn dense flat round icon="close" aria-label="Close Recording tools" @click="recordingToolsOpen = false" />
        </div>
        <!-- ScrollingSightReader teleports its existing controls here. All take state remains in that component. -->
      </div>
    </div>

    <div class="unified-body">
      <aside v-show="leftOpen" class="unified-sidebar unified-sidebar--left" :style="{ width: `${leftWidth}px` }" aria-label="Unified view and settings controls">
        <div class="unified-sidebar-title">
          <strong>Views</strong>
          <q-btn dense flat round icon="chevron_left" aria-label="Collapse sidebar" @click="leftOpen = false" />
        </div>
        <span class="sidebar-section-label" title="Toggle panes without changing the sidebar size">Visible panes</span>
        <q-checkbox
          v-for="pane in panes" :key="pane.id" dense dark keep-color color="primary"
          :model-value="visibility[pane.id]" :label="pane.label"
          @update:model-value="setVisible(pane.id, $event)"
        />
        <q-separator dark spaced />
        <q-expansion-item dense icon="cable" label="MIDI bridge / Cosmic actions">
          <CosmicMidiBridge class="unified-bridge" />
        </q-expansion-item>
        <q-expansion-item dense icon="tune" label="Music controls" default-opened>
          <SidebarControlsSettings />
        </q-expansion-item>
        <q-expansion-item dense icon="piano" label="Keyboard size">
          <SidebarPianoSettings />
        </q-expansion-item>
        <q-expansion-item dense icon="queue_music" label="Guitar settings">
          <SidebarGuitarSettings />
        </q-expansion-item>
        <q-expansion-item dense icon="music_note" label="Staff / playback settings">
          <SidebarStaffSettings />
        </q-expansion-item>
        <q-btn dense flat color="grey-4" icon="restart_alt" label="Restore four panes" @click="resetLayout" />
        <div class="sidebar-resize-handle sidebar-resize-handle--left" role="separator" tabindex="0"
          aria-label="Resize views sidebar" aria-orientation="vertical" title="Drag to resize the sidebar"
          @pointerdown.prevent="beginSidebarResize($event, 'left')"
          @keydown.left.prevent="nudgeSidebar('left', -24)" @keydown.right.prevent="nudgeSidebar('left', 24)" />
      </aside>
      <q-btn v-if="!leftOpen" class="unified-reveal unified-reveal--left" flat round icon="chevron_right" aria-label="Show view controls" @click="leftOpen = true" />

      <div ref="gridEl" class="unified-tiles" :style="gridStyle" :class="{ 'unified-tiles--maximized': maximized !== '' }" aria-label="Tiled music workspace">
        <section
          v-for="pane in panes" v-show="layout.ids.includes(pane.id)" :key="pane.id"
          class="unified-tile" :class="`unified-tile--${pane.id}`" :style="{ gridArea: layout.areas[pane.id] || 'auto' }"
          :aria-label="pane.label"
        >
          <div class="unified-tile-title">
            <span>{{ pane.label }}</span>
            <q-space />
            <q-btn v-if="pane.id === 'cosmic'" dense unelevated color="primary" text-color="black" icon="queue_music" label="Send to Staff" :disable="!cosmicFrameReady" title="Send current Cosmic Harmony path to staff" @click="sendCosmicPathToStaff" />
            <q-btn v-if="pane.id === 'cosmic'" dense flat round icon="article" :color="cosmicNarrativeOpen ? 'primary' : 'grey-5'" aria-label="Toggle full-height Cosmic narrative" title="Toggle Cosmic narrative" @click="toggleCosmicNarrative" />
            <q-btn v-if="pane.id === 'cosmic'" dense flat round icon="tune" :color="cosmicDetails ? 'primary' : 'grey-5'" aria-label="Show Cosmic Harmony navigation and narrative" @click="toggleCosmicDetails" />
            <q-btn dense flat round :icon="maximized === pane.id ? 'close_fullscreen' : 'open_in_full'" :aria-label="maximized === pane.id ? `Restore ${pane.label} tile` : `Maximize ${pane.label} tile`" @click="maximized = maximized === pane.id ? '' : pane.id" />
          </div>
          <div class="unified-tile-content">
            <iframe
              v-if="pane.id === 'cosmic'" :ref="setCosmicFrame"
              class="cosmic-embedded" :src="cosmicUrl" title="Interactive Cosmic Harmony"
              @load="onCosmicFrameLoad"
            />
            <ScrollingSightReader v-else-if="pane.id === 'staff'" unified-transport />
            <PianoKeyboard v-else-if="pane.id === 'piano'" />
            <StratocasterFretboard v-else-if="pane.id === 'guitar'" />
          </div>
        </section>
        <div v-if="layout.columns === 2 && !maximized" class="tile-split tile-split--vertical" :style="{ left: `${columnPercent}%`, top: layout.rows === 2 && layout.upperIds?.length === 1 ? `${rowTarget}%` : '0', bottom: layout.rows === 2 && layout.lowerIds?.length === 1 ? `${100 - rowTarget}%` : '0' }" role="separator" aria-label="Resize left and right tiles" aria-orientation="vertical" tabindex="0" @pointerdown.prevent="beginSplit($event, 'column')" @keydown.left.prevent="columnPercent = limitPercent(columnPercent - 5)" @keydown.right.prevent="columnPercent = limitPercent(columnPercent + 5)" />
        <div v-if="layout.rows === 2 && !maximized" class="tile-split tile-split--horizontal" :style="{ top: `${rowTarget}%` }" role="separator" aria-label="Resize upper and lower tiles" aria-orientation="horizontal" tabindex="0" @pointerdown.prevent="beginSplit($event, 'row')" @keydown.up.prevent="nudgeRow(-5)" @keydown.down.prevent="nudgeRow(5)" />
      </div>

      <q-btn v-if="!rightOpen" class="unified-reveal unified-reveal--right" flat round icon="chevron_left" aria-label="Show Circle of Fifths sidebar" @click="rightOpen = true" />
      <aside v-show="rightOpen" class="unified-sidebar unified-sidebar--right" :style="{ width: `${rightWidth}px` }" aria-label="Circle of Fifths and theory controls">
        <div class="unified-sidebar-title">
          <strong>Circle of Fifths</strong>
          <div class="sidebar-heading-actions">
            <q-btn dense flat round icon="open_in_full" aria-label="Expand Circle of Fifths" @click="store.fifthsFullscreenOpen = true">
              <q-tooltip v-if="store.tooltipsEnabled">Open the original full-screen Circle of Fifths, ladder, and controls</q-tooltip>
            </q-btn>
            <q-btn dense flat round icon="chevron_right" aria-label="Collapse Circle of Fifths" @click="rightOpen = false" />
          </div>
        </div>
        <!-- Reuse the original working widgets, including key and tooltip controls. -->
        <FifthsExplorer compact stacked />
        <TheoryControls />
        <q-expansion-item dense icon="info_outline" label="Session details" header-class="text-grey-4">
          <div class="session-inspector">
            <div class="session-topline">
              <div><div class="session-label">Key / mode</div><div class="session-value">{{ store.currentKey.label }} · {{ store.currentMode }}</div></div>
              <div><div class="session-label">Transport</div><div class="session-value">{{ store.srtTransportState }}</div></div>
            </div>
            <div class="session-label">Inspecting</div>
            <div class="session-value">{{ focusedChordName }}</div>
            <div class="session-subvalue">{{ focusedNotesText }}</div>
            <div class="session-label">Progression</div>
            <div class="session-value">{{ store.musicalSession.steps.length }} visits · {{ store.musicalSession.activeIndex >= 0 ? store.musicalSession.activeIndex + 1 : '—' }} active</div>
            <div v-if="store.musicalSession.steps.length" class="session-steps" aria-label="Shared harmonic progression">
              <div v-for="(step, index) in store.musicalSession.steps" :key="step.stepId"
                class="session-step" :class="{ 'session-step--active': index === store.musicalSession.activeIndex }">
                <span class="session-step-index">{{ index + 1 }}</span>
                <span class="session-step-name">{{ step.name }}</span>
              </div>
            </div>
            <p v-else class="sidebar-hint">Select a Cosmic chord to construct a progression.</p>
            <q-btn dense outline color="primary" icon="open_in_new" label="Full Cosmic window" @click="openCosmicWindow" />
          </div>
        </q-expansion-item>
        <div class="sidebar-resize-handle sidebar-resize-handle--right" role="separator" tabindex="0"
          aria-label="Resize Circle of Fifths sidebar" aria-orientation="vertical" title="Drag to resize the sidebar"
          @pointerdown.prevent="beginSidebarResize($event, 'right')"
          @keydown.left.prevent="nudgeSidebar('right', 24)" @keydown.right.prevent="nudgeSidebar('right', -24)" />
      </aside>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useNoteMapStore } from '../stores/noteMap'
import { UNIFIED_PANES, restoreUnifiedLayout, tileLayout, suggestedRowPercent } from '../music/unifiedTiling'
import CosmicMidiBridge from '../components/CosmicMidiBridge.vue'
import PianoKeyboard from '../components/PianoKeyboard.vue'
import StratocasterFretboard from '../components/StratocasterFretboard.vue'
import ScrollingSightReader from '../components/ScrollingSightReader.vue'
import SidebarControlsSettings from '../components/SidebarControlsSettings.vue'
import SidebarPianoSettings from '../components/SidebarPianoSettings.vue'
import SidebarGuitarSettings from '../components/SidebarGuitarSettings.vue'
import SidebarStaffSettings from '../components/SidebarStaffSettings.vue'
import FifthsExplorer from '../components/FifthsExplorer.vue'
import TheoryControls from '../components/TheoryControls.vue'

const store = useNoteMapStore()
const focusedChordName = computed(() => {
  const step = store.musicalSession.steps.find(item => item.stepId === store.musicalSession.focus.stepId)
  return step?.name || (store.musicalSession.focus.source ? `Selected via ${store.musicalSession.focus.source}` : 'No chord selected')
})
const focusedNotesText = computed(() => {
  const midis = store.musicalSession.focus.midis
  if (!midis.length) return 'Select a chord or notes to inspect their pitches.'
  const names = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']
  return midis.map(midi => `${names[midi % 12]}${Math.floor(midi / 12) - 1}`).join(' · ')
})
const panes = UNIFIED_PANES
const visibility = ref(restoreUnifiedLayout())
const leftOpen = ref(true)
const rightOpen = ref(false)
const leftWidth = ref(400)
const rightWidth = ref(440)
const recordingToolsOpen = ref(false)
const maximized = ref('')
const cosmicDetails = ref(false)
const cosmicNarrativeOpen = ref(true)
const cosmicFrameReady = ref(false)
const cosmicFrame = ref(null)
const gridEl = ref(null)
const columnPercent = ref(50)
const rowPercent = ref(62)
const rowAdjusted = ref(false)
const gridDimensions = ref({ width: 0, height: 0 })
const keyboardRatio = ref(8)
const rowTarget = computed(() => rowAdjusted.value ? rowPercent.value : suggestedRowPercent(layout.value, gridDimensions.value.width, gridDimensions.value.height, keyboardRatio.value))
const cosmicUrl = `${import.meta.env.BASE_URL}cosmic-harmony.html?embed=1`
const visibleIds = computed(() => panes.filter(pane => visibility.value[pane.id]).map(pane => pane.id))
const layout = computed(() => tileLayout(visibleIds.value, maximized.value))
const gridStyle = computed(() => ({
  gridTemplateColumns: layout.value.columns === 2 ? `${columnPercent.value}% minmax(0, 1fr)` : 'minmax(0, 1fr)',
  gridTemplateRows: layout.value.rows === 2 ? `${rowTarget.value}% minmax(0, 1fr)` : 'minmax(0, 1fr)'
}))

function nudgeRow(delta) {
  rowPercent.value = limitPercent(rowTarget.value + delta)
  rowAdjusted.value = true
}
function limitPercent(value) { return Math.max(24, Math.min(80, Math.round(value))) }
function setVisible(id, value) {
  if (value === false && visibleIds.value.length === 1) return
  visibility.value = { ...visibility.value, [id]: Boolean(value) }
  if (maximized.value === id && !value) maximized.value = ''
}
function resetLayout() {
  visibility.value = restoreUnifiedLayout()
  maximized.value = ''
  columnPercent.value = 50
  rowPercent.value = 62
  rowAdjusted.value = false
}
function toggleTransport() {
  if (store.srtTransportState === 'playing') store.requestSrtPause()
  else store.requestSrtPlay()
}
function setCosmicFrame(element) { cosmicFrame.value = element }
function onCosmicFrameLoad() { cosmicFrameReady.value = true; syncCosmicDetails() }
function syncCosmicDetails() {
  try {
    const doc = cosmicFrame.value?.contentDocument
    if (!doc) return
    doc.documentElement.classList.toggle('embed-details', cosmicDetails.value)
    doc.documentElement.classList.toggle('embed-narrative', cosmicNarrativeOpen.value && !cosmicDetails.value)
  } catch { /* iframe is same-origin on supported deployments */ }
}
function toggleCosmicDetails() {
  cosmicDetails.value = !cosmicDetails.value
  cosmicNarrativeOpen.value = !cosmicDetails.value
  syncCosmicDetails()
}
function toggleCosmicNarrative() {
  cosmicNarrativeOpen.value = !cosmicNarrativeOpen.value
  if (cosmicNarrativeOpen.value) cosmicDetails.value = false
  syncCosmicDetails()
}
function sendCosmicPathToStaff() {
  try {
    const button = cosmicFrame.value?.contentDocument?.getElementById('freeStaff')
    if (!button) return
    // Call the real Cosmic command: it preserves its path notes and MIDI bridge.
    button.click()
  } catch (error) { console.warn('Cosmic Harmony iframe not ready', error) }
}
function openCosmicWindow() {
  window.open(new URL(`${import.meta.env.BASE_URL}cosmic-harmony.html`, location.origin).href, 'cosmic-harmony', 'popup=yes,width=1150,height=850,resizable=yes,scrollbars=yes')
}
function clampSidebarWidth(value) {
  // Keep the opposite edge available even on narrow windows.
  return Math.round(Math.max(260, Math.min(650, window.innerWidth - 48, Number(value) || 400)))
}
function nudgeSidebar(side, delta) {
  const width = side === 'left' ? leftWidth : rightWidth
  width.value = clampSidebarWidth(width.value + delta)
}
function beginSidebarResize(event, side) {
  if (event.button !== 0) return
  const handle = event.currentTarget
  const pointerId = event.pointerId
  const startX = event.clientX
  const width = side === 'left' ? leftWidth : rightWidth
  const startWidth = width.value
  handle.setPointerCapture?.(pointerId)
  const move = e => {
    width.value = clampSidebarWidth(startWidth + (e.clientX - startX) * (side === 'left' ? 1 : -1))
  }
  const stop = () => {
    handle.removeEventListener('pointermove', move)
    handle.removeEventListener('pointerup', stop)
    handle.removeEventListener('pointercancel', stop)
    try { handle.releasePointerCapture?.(pointerId) } catch { /* ignored */ }
  }
  handle.addEventListener('pointermove', move)
  handle.addEventListener('pointerup', stop)
  handle.addEventListener('pointercancel', stop)
}
function beginSplit(event, axis) {
  if (!gridEl.value || event.button !== 0) return
  if (axis === 'row' && !rowAdjusted.value) { rowPercent.value = rowTarget.value; rowAdjusted.value = true }
  const pointerId = event.pointerId
  const divider = event.currentTarget
  divider.setPointerCapture?.(pointerId)
  const move = (e) => {
    const rect = gridEl.value?.getBoundingClientRect()
    if (!rect) return
    if (axis === 'column') columnPercent.value = limitPercent((e.clientX - rect.left) / rect.width * 100)
    else { rowPercent.value = limitPercent((e.clientY - rect.top) / rect.height * 100); rowAdjusted.value = true }
  }
  const stop = () => {
    divider.removeEventListener('pointermove', move)
    divider.removeEventListener('pointerup', stop)
    divider.removeEventListener('pointercancel', stop)
    try { divider.releasePointerCapture?.(pointerId) } catch { /* ignored */ }
  }
  divider.addEventListener('pointermove', move)
  divider.addEventListener('pointerup', stop)
  divider.addEventListener('pointercancel', stop)
}
function persistLayout() {
  try {
    window.localStorage.setItem('d3srt-unified-layout-v2', JSON.stringify({
      visibility: visibility.value, leftOpen: leftOpen.value, rightOpen: rightOpen.value,
      leftWidth: leftWidth.value, rightWidth: rightWidth.value,
      columnPercent: columnPercent.value, rowPercent: rowPercent.value, rowAdjusted: rowAdjusted.value
    }))
  } catch { /* persistence is optional */ }
}
let stopWatching
let gridObserver
let keyboardObserver
function measureGrid() {
  if (!gridEl.value) return
  const rect = gridEl.value.getBoundingClientRect()
  gridDimensions.value = { width: rect.width, height: rect.height }
  const svg = gridEl.value.querySelector('.unified-tile--piano svg[viewBox]')
  const vb = svg?.viewBox?.baseVal
  if (vb?.height && vb?.width) keyboardRatio.value = vb.width / vb.height
}
onMounted(() => {
  try {
    const saved = JSON.parse(window.localStorage.getItem('d3srt-unified-layout-v2') || window.localStorage.getItem('d3srt-unified-layout-v1') || 'null')
    if (saved) {
      visibility.value = restoreUnifiedLayout(saved.visibility)
      leftOpen.value = saved.leftOpen !== false
      rightOpen.value = saved.rightOpen === true
      leftWidth.value = clampSidebarWidth(saved.leftWidth || 400)
      rightWidth.value = clampSidebarWidth(saved.rightWidth || 440)
      columnPercent.value = limitPercent(Number(saved.columnPercent) || 50)
      rowPercent.value = limitPercent(Number(saved.rowPercent) || 62)
      rowAdjusted.value = saved.rowAdjusted === true
    }
  } catch { /* use defaults */ }
  leftWidth.value = clampSidebarWidth(leftWidth.value)
  rightWidth.value = clampSidebarWidth(rightWidth.value)
  if (window.innerWidth < 850) { leftOpen.value = false; rightOpen.value = false }
  gridObserver = new ResizeObserver(measureGrid)
  if (gridEl.value) gridObserver.observe(gridEl.value)
  keyboardObserver = new MutationObserver(measureGrid)
  if (gridEl.value) keyboardObserver.observe(gridEl.value, { subtree: true, attributes: true, attributeFilter: ['viewBox'] })
  measureGrid()
  stopWatching = watch([visibility, leftOpen, rightOpen, leftWidth, rightWidth, columnPercent, rowPercent, rowAdjusted], persistLayout, { deep: true })
})
onBeforeUnmount(() => { stopWatching?.(); gridObserver?.disconnect(); keyboardObserver?.disconnect() })
</script>

<style scoped>
.unified-page { height: calc(100dvh - 44px); min-height: 530px; display: flex; flex-direction: column; background:#20232b; color:#e9eef7; overflow:hidden; }
.unified-bridge { width:100%; margin-top:6px; font-size:12px; }
.unified-bridge :deep(.integration-panel) { padding:6px; }
.unified-bridge :deep(.integration-actions) { display:grid; }
.unified-bridge :deep(button), .unified-bridge :deep(select) { max-width:100%; font-size:12px; }
.unified-toolbar { position:relative; z-index:15; flex:0 0 auto; display:flex; align-items:center; gap:7px; padding:5px 10px; min-height:52px; border-bottom:1px solid #404958; background:#282d38; }
.unified-heading { letter-spacing:.02em; font-size:16px; white-space:nowrap; }
.unified-key { font-size:12px; color:#9ad4cd; white-space:nowrap; }
.unified-tempo { width:82px; }
.unified-body { flex:1 1 auto; min-height:0; display:flex; gap:4px; padding:6px; overflow:hidden; position:relative; }
.unified-sidebar { position:absolute; top:6px; bottom:6px; z-index:11; display:flex; flex-direction:column; gap:8px; min-width:0; max-width:calc(100% - 32px); overflow:auto; background:rgba(28,36,49,.95); border:1px solid #526478; padding:11px 14px; border-radius:8px; backdrop-filter:blur(12px) saturate(110%); box-shadow:0 9px 26px #0008; scrollbar-gutter:stable; }
.unified-sidebar--left { left:6px; }
.unified-sidebar--right { right:6px; }
.unified-sidebar-title { display:flex; align-items:center; justify-content:space-between; flex:0 0 auto; }
.sidebar-heading-actions { display:flex; gap:2px; }
.sidebar-section-label { font-size:11px; color:#c1d2df; letter-spacing:.06em; text-transform:uppercase; }
.sidebar-hint { color:#b0bbca; line-height:1.4; font-size:12px; margin:0 0 6px; }
.sidebar-resize-handle { position:absolute; z-index:15; top:0; bottom:0; width:13px; cursor:ew-resize; touch-action:none; background:transparent; }
.sidebar-resize-handle--left { right:0; }
.sidebar-resize-handle--right { left:0; }
.sidebar-resize-handle::after { content:''; position:absolute; top:38%; bottom:38%; left:5px; width:3px; border-radius:3px; background:#91aec188; }
.sidebar-resize-handle:hover::after,.sidebar-resize-handle:focus-visible::after { background:#94e1d9; }
.sidebar-resize-handle:focus-visible { outline:2px solid #94e1d9; outline-offset:-2px; }
.unified-recording-popover { position:absolute; z-index:22; right:65px; top:calc(100% + 5px); max-height:min(70vh,600px); overflow:auto; width:min(590px,calc(100vw - 26px)); padding:12px; border:1px solid #68849c; border-radius:9px; background:rgba(27,42,55,.98); box-shadow:0 14px 40px #000a; }
.unified-recording-title { display:flex; align-items:center; justify-content:space-between; padding:0 5px 6px; border-bottom:1px solid #4a6478; }
.unified-recording-popover :deep(.recording-tools) { max-width:none; border-top:0; }
.unified-recording-popover :deep(.recording-tools summary) { display:none; }
.unified-recording-popover :deep(.tools-hint) { display:none; }
.unified-recording-popover :deep(.recording-tools) { width:100%; }
.unified-sidebar :deep(.q-expansion-item) { border-top:1px solid #444d59; }
.unified-sidebar :deep(.q-checkbox__label) { font-size:14px; }
.unified-sidebar :deep(.q-expansion-item__content) { padding:4px; }
.unified-reveal { position:absolute; z-index:12; top:50%; transform:translateY(-50%); width:28px; min-width:28px; height:74px; border:1px solid #506075; background:rgba(28,36,49,.95); }
.unified-reveal--left { left:6px; }
.unified-reveal--right { right:6px; }
.unified-tiles { position:relative; flex:1 1 auto; min-height:0; min-width:0; display:grid; gap:6px; overflow:hidden; }
.unified-tile { min-width:0; min-height:0; overflow:hidden; display:flex; flex-direction:column; border:1px solid #475363; border-radius:8px; background:#292e36; }
.unified-tile-title { min-height:31px; padding:1px 5px 1px 10px; display:flex; align-items:center; gap:4px; font-size:12px; font-weight:700; color:#bbd1df; border-bottom:1px solid #434d59; }
.unified-tile-title :deep(.q-btn) { min-height:27px; min-width:27px; }
.unified-tile-content { flex:1 1 auto; min-height:0; min-width:0; overflow:auto; background:#202020; }
.unified-tile-content :deep(.instrument-section), .unified-tile-content :deep(.srt-shell) { width:100%; min-width:0; }
.cosmic-embedded { display:block; border:0; width:100%; height:100%; background:#101522; }
.tile-split { position:absolute; z-index:6; background:transparent; touch-action:none; }
.tile-split:focus-visible { outline:2px solid #9dd4ff; background:#447c9999; }
.tile-split--vertical { top:0; bottom:0; width:9px; transform:translateX(-50%); cursor:col-resize; }
.tile-split--horizontal { left:0; right:0; height:9px; transform:translateY(-50%); cursor:row-resize; }
.tile-split:hover { background:#6bc2b155; }
.session-label { text-transform:uppercase; font-size:11px; color:#90abc4; margin-top:8px; }
.session-value { font-size:14px; overflow-wrap:anywhere; }
.session-inspector { min-height:0; display:flex; flex-direction:column; gap:5px; }
.session-topline { display:flex; gap:12px; flex-wrap:wrap; }
.session-topline > * { min-width:75px; }
.session-subvalue { font-size:12px; color:#b3c7d6; line-height:1.4; overflow-wrap:anywhere; }
.session-steps { margin-top:8px; border:1px solid #41516b; border-radius:6px; overflow-y:auto; min-height:0; max-height:44vh; }
.session-step { display:flex; gap:8px; align-items:center; padding:6px 8px; border-bottom:1px solid #344357; font-size:12px; }
.session-step:last-child { border-bottom:0; }
.session-step--active { background:#264c58; border-left:3px solid #80d2b1; padding-left:5px; }
.session-step-index { min-width:22px; color:#90abc4; font-variant-numeric:tabular-nums; }
.session-step-name { overflow-wrap:anywhere; }
.unified-sidebar--right > .q-space { min-height:4px; }
@media (max-width:950px) {
  .unified-sidebar { max-width:calc(100% - 30px); }
  .unified-page { min-height:560px; }
}
@media (max-width:690px) {
  .unified-toolbar { flex-wrap:wrap; }
  .unified-key { display:none; }
  .unified-sidebar { max-width:calc(100% - 30px); }
  .unified-tiles { min-width:0; }
}
</style>

<style scoped>
/* Slice 4: preserve original geometry; center narrow content in unused pane height. */
.unified-tile--staff .unified-tile-content,
.unified-tile--piano .unified-tile-content,
.unified-tile--guitar .unified-tile-content { display: flex; align-items: safe center; }
.unified-tile--staff .unified-tile-content > *,
.unified-tile--piano .unified-tile-content > *,
.unified-tile--guitar .unified-tile-content > * { width: 100%; flex: 0 0 auto; }
.unified-tile--cosmic .unified-tile-content { overflow: hidden; }
</style>
