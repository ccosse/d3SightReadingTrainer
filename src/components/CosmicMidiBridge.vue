<template>
  <section class="integration-panel" aria-label="Cosmic Harmony MIDI connection">
    <div class="integration-title"><strong>Cosmic Harmony · MIDI bridge</strong><span class="integration-note">M9 · Cosmic Challenge</span></div>
    <div class="integration-actions">
      <button type="button" @click="openCosmic">Open Cosmic Harmony ↗</button>
      <button type="button" @click="launchChallenge">🎹 Cosmic Challenge</button>
      <button type="button" :disabled="!midiAvailable" @click="connectMidi">{{ connected ? 'Change MIDI input' : 'Connect MIDI' }}</button>
      <select v-if="inputs.length" v-model="selectedInput" @change="selectInput" aria-label="MIDI input">
        <option v-for="input in inputs" :key="input.id" :value="input.id">{{ input.name }}</option>
      </select>
    </div>
    <div class="integration-audio"><label><input v-model="monitorEnabled" type="checkbox" @change="changeMonitor" /> Play MIDI through selected instrument</label><span>{{ monitorStatus }}</span></div>
    <div class="integration-status" role="status">{{ status }}</div>
    <div class="integration-status">{{ recentEvent }}</div>
    <button type="button" class="info-link" @click="showCredits = true">About / Credits</button>
    <div v-if="showCredits" class="credits-backdrop" @click.self="showCredits=false"><div class="credits-dialog" role="dialog" aria-modal="true" aria-label="Credits"><button type="button" @click="showCredits=false">Close</button><h3>Cosmic Harmony + d3SRT</h3><p>The major and minor Cosmic harmony model is an interactive educational adaptation of Randy Halberstadt's <em>Metaphors for the Musician</em>, Chapter 22, “Harmonic Astronomy.” The exploratory Blues mode is our own extension, not a reproduction of the book.</p><p>d3SRT receives MIDI locally and forwards note events to Cosmic Harmony using a same-origin browser channel. Raw recordings stay on your device unless you explicitly export or share them.</p></div></div>
  </section>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useNoteMapStore } from '../stores/noteMap'
import { ingestLiveMidi } from '../music/liveMidiCapture'
import { ensureAudioReady, startMidi, stopMidiVoice } from '../music/audio'

const store = useNoteMapStore()
const midiAvailable = typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess
const status = ref('Not connected')
const recentEvent = ref('No MIDI events yet')
const monitorEnabled = ref(false)
const showCredits = ref(false)
const monitorStatus = ref('Off · keyboard sounds unaffected')
const playingVoices = new Map()
let monitorGeneration = 0
const inputs = ref([])
const selectedInput = ref('')
const connected = computed(() => !!selectedInput.value && !!access?.inputs.get(selectedInput.value))
let access = null
let activeInput = null
let channel = null
let child = null
let pendingChallenge = false

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
function launchChallenge() {
  pendingChallenge = true
  openCosmic()
  // An already-open companion will not issue another ready signal.
  if (child && !child.closed) publish('challenge-start')
}
function openCosmic() {
  // Public asset is copied to the built app root; BASE_URL supports GitHub Pages.
  const url = new URL(`${import.meta.env.BASE_URL}cosmic-harmony.html`, location.origin)
  child = window.open(url.href, 'cosmic-harmony', 'popup=yes,width=1150,height=850,resizable=yes,scrollbars=yes')
  if (!child) status.value = 'Pop-up blocked. Allow pop-ups for this site and try again.'
  publishKey()
  publishStatus()
}
async function changeMonitor() {
  if (!monitorEnabled.value) { monitorGeneration++; releaseVoices(); monitorStatus.value = 'Off · keyboard sounds unaffected'; return }
  if (store.audioEngine === 'web-midi') {
    monitorEnabled.value = false
    monitorStatus.value = 'Choose an internal instrument or SoundFont to avoid MIDI feedback.'
    return
  }
  try {
    await ensureAudioReady()
    monitorStatus.value = 'On · '+store.audioEngine
  } catch (error) {
    monitorEnabled.value = false
    monitorStatus.value = 'Audio unavailable: '+error.message
  }
}
function releaseVoices() {
  for (const voice of playingVoices.values()) if (voice) stopMidiVoice(voice, 0.06)
  playingVoices.clear()
}
function monitorMidi(bytes) {
  if (!monitorEnabled.value || store.audioEngine === 'web-midi') return
  const [status=0, pitch=0, velocity=0] = bytes
  const type = status & 0xf0, channel = status & 0x0f
  const key = channel+':'+pitch
  if (type===0x90 && velocity>0) {
    const prior=playingVoices.get(key)
    if (prior) stopMidiVoice(prior, 0.03)
    playingVoices.delete(key)
    const generation=monitorGeneration
    // Asynchronous SoundFont loads must not leave stuck notes if Note Off arrives first.
    const pending={ pending:true }
    playingVoices.set(key,pending)
    startMidi(pitch, Math.max(0.02,Math.min(0.22,velocity/127*0.17))).then(voice=>{
      if (monitorGeneration!==generation || playingVoices.get(key)!==pending || !monitorEnabled.value) stopMidiVoice(voice,0.04)
      else playingVoices.set(key,voice)
    }).catch(error=>{monitorStatus.value='Audio error: '+error.message;playingVoices.delete(key)})
  } else if (type===0x80 || (type===0x90 && velocity===0)) {
    const voice=playingVoices.get(key)
    playingVoices.delete(key)
    if (voice&&!voice.pending) stopMidiVoice(voice,0.09)
  } else if(type===0xb0 && (pitch===120||pitch===123)) {monitorGeneration++;releaseVoices()}
}
function midiMessage(event) {
  const bytes = [...event.data]
  const statusByte = bytes[0] || 0
  if ([0xfe, 0xf8, 0xfa, 0xfc].includes(statusByte)) return
  recentEvent.value = `MIDI: ${bytes.map(v => v.toString(16).padStart(2, '0')).join(' ')} · ${Math.round(event.timeStamp)} ms`
  ingestLiveMidi(bytes, event.timeStamp)
  monitorMidi(bytes)
  publish('midi', { bytes, timestamp: event.timeStamp })
}
function selectInput() {
  if (activeInput) activeInput.onmidimessage = null
  monitorGeneration++; releaseVoices()
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
        if (pendingChallenge) { publish('challenge-start'); pendingChallenge = false }
      }
    }
  }
})
watch(() => [store.currentKeyId, store.currentMode], publishKey)
onBeforeUnmount(() => {
  if (activeInput) activeInput.onmidimessage = null
  monitorGeneration++;releaseVoices()
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

<style scoped>
.integration-audio{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:9px;font-size:12px;color:#bdd8ef}.integration-audio label{cursor:pointer}.info-link{border:0;background:none;color:#c1dcfc;cursor:pointer;font-size:12px;padding:5px 0;text-decoration:underline}.credits-backdrop{position:fixed;inset:0;z-index:9999;background:#000b;display:grid;place-items:center}.credits-dialog{background:#1b2836;color:#fff;max-width:520px;margin:20px;padding:24px;border:1px solid #5b6881;border-radius:12px;line-height:1.55}.credits-dialog button{float:right;background:#30445b;color:#fff;border:1px solid #667d94;border-radius:5px;padding:7px 12px;cursor:pointer}
</style>
