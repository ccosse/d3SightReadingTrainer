<template>
  <q-page class="music-workspace">
    <q-tabs
      v-model="store.activeTab"
      dense
      align="left"
      active-color="light-blue-3"
      indicator-color="light-blue-3"
      class="workspace-tabs"
      outside-arrows
      mobile-arrows
    >
      <q-tab name="note-map" label="Note Map" />
      <q-tab name="sight-reading" label="Sight Reading" />
      <q-tab name="guitar-tab" label="Guitar TAB" />
      <q-tab name="fifths" label="Circle of Fifths" />
      <q-tab name="composer" label="Composer" />
    </q-tabs>

    <q-tab-panels v-model="store.activeTab" animated keep-alive class="workspace-panels">
      <q-tab-panel name="note-map" class="q-pa-none">
        <PitchClassSelector />

        <div class="hud row items-center justify-between q-my-md q-px-sm">
          <div class="text-caption"><strong>Selection:</strong> {{ store.selectedSummary }}</div>
          <div class="text-caption"><strong>Key:</strong> {{ store.currentKey.label }} major</div>
          <div class="text-caption text-light-blue-2">{{ store.focusText }}</div>
        </div>

        <div class="instrument-stack">
          <PianoKeyboard v-if="store.visibleObjects.piano" />
          <StratocasterFretboard v-if="store.visibleObjects.guitar" />
          <GrandStaff v-if="store.visibleObjects.staff" />
        </div>
      </q-tab-panel>

      <q-tab-panel name="sight-reading" class="q-pa-none">
        <FeaturePlaceholder
          title="Sight Reading"
          text="The SRT-style scrolling grand-staff drill will live here, with Web MIDI input and the Note Map available as a collapsible HUD."
        />
      </q-tab-panel>

      <q-tab-panel name="guitar-tab" class="q-pa-none">
        <FeaturePlaceholder
          title="Guitar TAB"
          text="Scrolling tablature, position constraints, string/fret recognition, and keyboard correspondence will live here."
        />
      </q-tab-panel>

      <q-tab-panel name="fifths" class="q-pa-none">
        <div class="circle-grid">
          <CircleOfFifths />
          <KeySummary />
        </div>
      </q-tab-panel>

      <q-tab-panel name="composer" class="q-pa-none">
        <FeaturePlaceholder
          title="Composer"
          text="Chord designer, progression timeline, save/playback, Web MIDI output, and generative accompaniment—including stride piano—will live here."
        />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup>
import CircleOfFifths from '../components/CircleOfFifths.vue'
import FeaturePlaceholder from '../components/FeaturePlaceholder.vue'
import GrandStaff from '../components/GrandStaff.vue'
import KeySummary from '../components/KeySummary.vue'
import PianoKeyboard from '../components/PianoKeyboard.vue'
import PitchClassSelector from '../components/PitchClassSelector.vue'
import StratocasterFretboard from '../components/StratocasterFretboard.vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
</script>

<style scoped>
.music-workspace {
  width: 100%;
  max-width: 1380px;
  margin: 0 auto;
  padding: 14px 18px 34px;
  background: #333;
  color: white;
}

.workspace-tabs {
  color: #ddd;
  border-bottom: 1px solid #555;
  margin-bottom: 16px;
}

.workspace-panels { background: transparent; color: white; }
.instrument-stack { display: grid; gap: 24px; }
.instrument-stack > * {
  border: 1px solid #555;
  border-radius: 12px;
  background: #2b2b2b;
  padding: 14px;
}
.hud { min-height: 34px; border-radius: 8px; background: #292929; border: 1px solid #4e4e4e; gap: 10px; }
.circle-grid { display: grid; grid-template-columns: minmax(340px, 0.9fr) minmax(320px, 1.1fr); gap: 24px; align-items: start; }

@media (max-width: 880px) {
  .circle-grid { grid-template-columns: 1fr; }
  .music-workspace { padding-inline: 10px; }
}
</style>
