<template>
  <section class="integration-panel" aria-label="Cosmic Harmony MIDI connection">
    <div class="integration-title"><strong>Cosmic Harmony · MIDI bridge</strong><span class="integration-note">M24.1 · Mouse-free route fixes</span></div>
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
import { ingestLiveMidi, importLiveCaptureJson, liveCapture } from '../music/liveMidiCapture'
import { ensureAudioReady, startMidi, stopMidiVoice } from '../music/audio'
import { MAJOR_KEYS } from '../music/theory'

const store = useNoteMapStore()
const midiAvailable = typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess
const status = ref('Not connected')
const recentEvent = ref('No MIDI events yet')
const monitorEnabled = ref(false)
const showCredits = ref(false)
const monitorStatus = ref('Off · keyboard sounds unaffected')
const playingVoices = new Map()
// Visual MIDI state is independent of the optional sound monitor.
const liveHighlightTokens = new Map()
const sustainedHighlightTokens = new Map()
const sustainPedals = new Set()
function releaseSustained(channel) {
 for(const [key,token] of sustainedHighlightTokens)if(key.startsWith(channel+':')){store.endPlaying(token);sustainedHighlightTokens.delete(key)}
}
function clearLiveHighlights() {
  for (const token of liveHighlightTokens.values()) store.endPlaying(token)
  liveHighlightTokens.clear()
  for(const token of sustainedHighlightTokens.values())store.endPlaying(token)
  sustainedHighlightTokens.clear();sustainPedals.clear()
}
function highlightLiveMidi(bytes) {
  const [status=0, note=0, velocity=0] = bytes
  const kind=status & 0xf0, channel=status & 0x0f, key=`${channel}:${note}`
  if (kind===0x90 && velocity>0) {
    const old=liveHighlightTokens.get(key)
    if (old!==undefined) store.endPlaying(old)
    const sustained=sustainedHighlightTokens.get(key);if(sustained!==undefined){store.endPlaying(sustained);sustainedHighlightTokens.delete(key)}
    liveHighlightTokens.set(key,store.beginPlaying([note],'live-midi'))
  } else if (kind===0x80 || (kind===0x90 && velocity===0)) {
    const token=liveHighlightTokens.get(key)
    if (token!==undefined) {if(sustainPedals.has(channel))sustainedHighlightTokens.set(key,token);else store.endPlaying(token)}
    liveHighlightTokens.delete(key)
  } else if(kind===0xb0 && note===64){if(velocity>=64)sustainPedals.add(channel);else{sustainPedals.delete(channel);releaseSustained(channel)}} else if (kind===0xb0 && (note===120 || note===123)) clearLiveHighlights()
}

let monitorGeneration = 0
const inputs = ref([])
const selectedInput = ref('')
const connected = computed(() => !!selectedInput.value && !!access?.inputs.get(selectedInput.value))
let access = null
let activeInput = null
let channel = null
let child = null
let pendingChallenge = false
let auditionToken=0
async function auditionChord(notes,durationMs=950){
 if(!Array.isArray(notes)||notes.length>16||notes.some(n=>!Number.isInteger(n)||n<0||n>127))return
 const id=++auditionToken
 if(store.audioEngine==='web-midi'){status.value='Select an internal or SoundFont instrument to audition chords.';return}
 try{
  await ensureAudioReady()
  const voices=await Promise.all(notes.map(n=>startMidi(n,0.14)))
  if(id!==auditionToken){voices.forEach(v=>stopMidiVoice(v,0.03));return}
  const token=store.beginPlaying(notes,'cosmic-audition')
  setTimeout(()=>{voices.forEach(v=>stopMidiVoice(v,0.07));store.endPlaying(token)},Math.max(100,Math.min(5000,Number(durationMs)||950)))
 }catch(e){status.value='Chord audition failed: '+e.message}
}

function loadChallengeScore(data) {
  if (!Array.isArray(data.steps) || data.steps.length < 1 || data.steps.length > 64) return
  if (liveCapture.recording) { status.value='Stop recording before importing a Cosmic Challenge.'; return }
  if (liveCapture.notes.length && !window.confirm('Replace the current MIDI take with this Cosmic Challenge score? Export your existing take first if needed.')) return
  const bpm=Math.max(30,Math.min(220,Number(store.srtTempo)||72))
  const beatMs=60000/bpm
  const events=[]
  for (let i=0;i<data.steps.length;i++) {
    const step=data.steps[i]
    if (!Array.isArray(step?.notes) || step.notes.length > 32) return
    const onset=Math.round(i*4*beatMs)
    const release=Math.round((i*4+3.5)*beatMs)
    const seen=new Set()
    for (const note of step.notes) {
      if (!Number.isInteger(note?.midi) || note.midi<0 || note.midi>127) return
      const ch=Number.isInteger(note.channel)&&note.channel>=0&&note.channel<=15?note.channel:0
      const velocity=Math.max(1,Math.min(127,Math.round(Number(note.velocity)||90)))
      const key=ch+':'+note.midi
      if(seen.has(key))continue
      seen.add(key)
      events.push({atMs:onset,bytes:[0x90|ch,note.midi,velocity]})
      events.push({atMs:release,bytes:[0x80|ch,note.midi,0]})
    }
  }
  if (!events.length)return
  const durationMs=Math.round(data.steps.length*4*beatMs)
  try {
    // Match the grand staff key signature to the Cosmic challenge key.
    // d3SRT represents minor keys using their relative major key signatures.
    const tonic=String(data.tonic || '')
    const wantedMode=data.mode==='minor'?'minor':'major'
    const key=MAJOR_KEYS.find(k=> wantedMode==='minor'
      ? k.relativeMinor.split(' ')[0] === tonic
      : k.label === tonic)
    if(key)store.setKey(key.id,{mode:wantedMode})
    const count=importLiveCaptureJson({format:'d3srt-raw-midi-take',version:1,bpm,durationMs,events})
    store.setSrtTempo(bpm)
    window.dispatchEvent(new CustomEvent('cosmic-take-loaded',{detail:{stepCount:data.steps.length}}))
    status.value=`Challenge score: ${data.steps.length} bars of 4/4 · ${count} played notes · ${bpm} BPM. Timing is a practice grid, not the original performance. Review or export JSON.`
  } catch(error) { status.value=`Challenge import failed: ${error.message}` }
}
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
  highlightLiveMidi(bytes)
  monitorMidi(bytes)
  publish('midi', { bytes, timestamp: event.timeStamp })
}
function selectInput() {
  if (activeInput) activeInput.onmidimessage = null
  monitorGeneration++; releaseVoices(); clearLiveHighlights()
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
function forwardPlayhead(event){publish('take-playhead',event.detail || {})}
onMounted(() => {
  window.addEventListener('cosmic-take-playhead', forwardPlayhead)
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('d3srt-cosmic-v1')
    channel.onmessage = ({ data }) => {
      if (data?.source === 'cosmic' && data?.version === 1 && data?.type === 'audition-chord'){auditionChord(data.notes,data.durationMs); if(Number.isInteger(data.stepIndex))window.dispatchEvent(new CustomEvent('cosmic-review-step',{detail:{index:data.stepIndex}}));return}
      if (data?.source === 'cosmic' && data?.version === 1 && data?.type === 'select-step'){window.dispatchEvent(new CustomEvent('cosmic-review-step',{detail:{index:data.index}}));return}
      if (data?.source === 'cosmic' && data?.version === 1 && data?.type === 'challenge-take') { loadChallengeScore(data); return }
      if (data?.source === 'cosmic' && data?.version === 1 && data?.type === 'ready') {
        publishKey(); publishStatus()
        if (pendingChallenge) { publish('challenge-start'); pendingChallenge = false }
      }
    }
  }
})
watch(() => [store.currentKeyId, store.currentMode], publishKey)
onBeforeUnmount(() => {
  window.removeEventListener('cosmic-take-playhead',forwardPlayhead)
  if (activeInput) activeInput.onmidimessage = null
  monitorGeneration++;releaseVoices();clearLiveHighlights()
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
