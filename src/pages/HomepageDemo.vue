<template>
  <main class="homepage-demo" aria-label="Interactive d3 Sight Reading Trainer demo">
    <div class="demo-toolbar">
      <span class="demo-title">d3 Sight Reading Trainer</span>
      <span class="demo-key">{{ store.currentKey.label }} · {{ store.currentMode }}</span>
      <div class="demo-controls">
        <button type="button" :aria-label="playing ? 'Pause music' : 'Play generated sight reading exercise'" @click="togglePlay">{{ playing ? 'Ⅱ Pause' : '▶ Play' }}</button>
        <button type="button" aria-label="Generate another musical exercise" @click="newExercise">↻ New</button>
        <button type="button" :aria-pressed="store.srtMetronomeOn" @click="store.srtMetronomeOn = !store.srtMetronomeOn">♩ {{ store.srtMetronomeOn ? 'On' : 'Off' }}</button>
      </div>
    </div>
    <div class="demo-staff"><ScrollingSightReader unified-transport /></div>
    <div class="demo-piano"><PianoKeyboard /></div>
    <div id="unified-recording-tools" hidden></div>
    <p class="demo-hint">Click piano keys to play · Use Play for generated notation</p>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount } from 'vue'
import PianoKeyboard from '../components/PianoKeyboard.vue'
import ScrollingSightReader from '../components/ScrollingSightReader.vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const playing = computed(() => store.srtTransportState === 'playing')

function togglePlay() {
  if (playing.value) store.requestSrtPause()
  else store.requestSrtPlay()
}
function newExercise() {
  store.requestSrtStop()
  store.srtGenerationNonce += 1
}
onBeforeUnmount(() => store.requestSrtStop())
</script>

<style scoped>
.homepage-demo { width:100%; min-height:100vh; overflow:hidden; background:#303030; color:#eee; padding:10px 14px; display:flex; flex-direction:column; gap:8px; font-family:system-ui,sans-serif; }
.demo-toolbar { display:flex; align-items:center; gap:12px; flex-wrap:wrap; min-height:36px; padding-right:90px; }
.demo-title { color:#ebf0f1; font-weight:700; font-size:15px; }
.demo-key { font-size:12px; color:#b9cdcb; }
.demo-controls { display:flex; gap:6px; margin-left:auto; }
.demo-controls button { border:1px solid #666; background:#252525; color:#eee; border-radius:6px; padding:5px 9px; cursor:pointer; }
.demo-controls button:hover, .demo-controls button:focus-visible { border-color:#d5ed45; }
.demo-staff { flex:0 0 auto; min-width:0; }
.demo-piano { width:min(650px,100%); margin:0 auto; min-width:0; }
.demo-hint { text-align:center; margin:0; color:#b7b7b7; font-size:11px; }
@media(max-width:600px) { .homepage-demo {padding:7px;gap:5px;} .demo-toolbar{padding-right:0;} .demo-title{font-size:12px;} .demo-controls{margin-left:0;} .demo-controls button{padding:4px 6px;font-size:11px;} .demo-hint{display:none;} }
</style>
<style>
html, body, #q-app { min-height:100%; background:#303030; }
.homepage-demo .srt-shell { padding:0 !important; margin:0 !important; }
.homepage-demo .scroll-stage { width:100%; }
.homepage-demo .recording-console { display:none !important; }
.homepage-demo .instrument-section { margin:0 !important; }
</style>
