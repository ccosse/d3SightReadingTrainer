<template>
  <section class="integration-panel" aria-label="Cosmic Harmony MIDI connection">
    <div class="integration-title"><strong>Cosmic Harmony · MIDI bridge</strong><span class="integration-note">First integration milestone</span></div>
    <div class="integration-actions">
      <button type="button" @click="openCosmic">Open Cosmic Harmony ↗</button>
      <button type="button" :disabled="!midiAvailable" @click="connectMidi">{{ connected ? 'Change MIDI input' : 'Connect MIDI' }}</button>
      <select v-if="inputs.length" v-model="selectedInput" @change="selectInput" aria-label="MIDI input">
        <option v-for="input in inputs" :key="input.id" :value="input.id">{{ input.name }}</option>
      </select>
    </div>
    <div class="integration-status" role="status">{{ status }}</div>
    <div class="integration-status">{{ recentEvent }}</div>
    <p class="integration-note">d3SRT owns the MIDI input. Cosmic receives the same raw events in a second window, with no duplicate device connection. Key changes in d3SRT synchronize to Cosmic.</p>
  </section>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useNoteMapStore } from '../stores/noteMap'
import { ingestLiveMidi } from '../music/liveMidiCapture'

const store = useNoteMapStore()
const midiAvailable = typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess
const status = ref('Not connected')
const recentEvent = ref('No MIDI events yet')
const inputs = ref([])
const selectedInput = ref('')
const connected = computed(() => !!selectedInput.value && !!access?.inputs.get(selectedInput.value))
let access = null
let activeInput = null
let channel = null
let child = null

function publish(type, fields = {}) {
  channel?.postMessage({ source: 'd3srt', version: 1, type, ...fields })
}
function currentTonic() {
  if (store.currentMode !== 'minor') return store.currentKey.label
  // d3SRT indexes minor keys by their relative MAJOR tonic.
  const relativeMinor = store.currentKey.relativeMinor.split(' ')[0].replace(/minor$/, '')
  return relativeMinor || 'A'
}
function publishKey() { publish('key', { tonic: currentTonic(), mode: store.currentMode }) }
function publishStatus() { publish('status', { connected: !!activeInput, device: activeInput?.name || '' }) }
function openCosmic() {
  // Public asset is copied to the built app root; BASE_URL supports GitHub Pages.
  const url = new URL(`${import.meta.env.BASE_URL}cosmic-harmony.html`, location.origin)
  child = window.open(url.href, 'cosmic-harmony', 'popup=yes,width=1150,height=850,resizable=yes,scrollbars=yes')
  if (!child) status.value = 'Pop-up blocked. Allow pop-ups for this site and try again.'
  publishKey()
  publishStatus()
}
function midiMessage(event) {
  const bytes = [...event.data]
  const statusByte = bytes[0] || 0
  if ([0xfe, 0xf8, 0xfa, 0xfc].includes(statusByte)) return
  recentEvent.value = `MIDI: ${bytes.map(v => v.toString(16).padStart(2, '0')).join(' ')} · ${Math.round(event.timeStamp)} ms`
  ingestLiveMidi(bytes, event.timeStamp)
  publish('midi', { bytes, timestamp: event.timeStamp })
}
function selectInput() {
  if (activeInput) activeInput.onmidimessage = null
  activeInput = access?.inputs.get(selectedInput.value) || null
  if (activeInput) activeInput.onmidimessage = midiMessage
  status.value = activeInput ? `Listening to ${activeInput.name}` : 'Choose a MIDI input'
  publishStatus()
}
function refreshInputs() {
  inputs.value = access ? [...access.inputs.values()].map(({ id, name }) => ({ id, name })) : []
  if (!inputs.value.some(x => x.id === selectedInput.value)) {
    selectedInput.value = inputs.value.find(x => /P-71|reface/i.test(x.name))?.id || inputs.value[0]?.id || ''
  }
  selectInput()
}
async function connectMidi() {
  if (!midiAvailable) { status.value = 'Web MIDI unavailable: use Chrome on HTTPS or localhost.'; return }
  try {
    access = await navigator.requestMIDIAccess({ sysex: false })
    access.onstatechange = refreshInputs
    refreshInputs()
  } catch (error) { status.value = `MIDI unavailable: ${error.message}` }
}
onMounted(() => {
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('d3srt-cosmic-v1')
    channel.onmessage = ({ data }) => {
      if (data?.source === 'cosmic' && data?.version === 1 && data?.type === 'ready') {
        publishKey(); publishStatus()
      }
    }
  }
})
watch(() => [store.currentKeyId, store.currentMode], publishKey)
onBeforeUnmount(() => {
  if (activeInput) activeInput.onmidimessage = null
  if (access) access.onstatechange = null
  channel?.close()
})
</script>

<style scoped>
.integration-panel{border:1px solid #5b6881;border-radius:9px;padding:12px 15px;background:#1b2836;color:#f0f4fa;margin:4px 0 12px}
.integration-title{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-bottom:9px}
.integration-actions{display:flex;flex-wrap:wrap;gap:8px}
.integration-actions button,.integration-actions select{border:1px solid #667d94;border-radius:6px;background:#30445b;color:white;padding:7px 10px;cursor:pointer}
.integration-actions button:disabled{opacity:.4;cursor:not-allowed}
.integration-status{font-size:12px;color:#bde4fc;margin-top:8px;overflow-wrap:anywhere}
.integration-note{font-size:12px;color:#a8bfd3;margin:8px 0 0}
</style>
