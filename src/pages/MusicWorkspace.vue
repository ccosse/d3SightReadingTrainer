<template>
  <q-page padding class="music-workspace">
    <q-tabs
      v-model="activeTab"
      dense
      align="left"
      active-color="primary"
      indicator-color="primary"
      class="q-mb-md"
      outside-arrows
      mobile-arrows
    >
      <q-tab name="note-map" label="Note Map" />
      <q-tab name="sight-reading" label="Sight Reading" />
      <q-tab name="guitar-tab" label="Guitar TAB" />
      <q-tab name="fifths" label="Circle of Fifths" />
      <q-tab name="composer" label="Composer" />
    </q-tabs>

    <q-separator class="q-mb-lg" />

    <q-tab-panels v-model="activeTab" animated keep-alive>
      <q-tab-panel name="note-map" class="q-pa-none">
        <PitchClassSelector />

        <div class="row items-center q-gutter-sm q-my-md">
          <span class="text-caption text-grey-7">Show:</span>
          <q-toggle v-model="showPiano" label="Piano" />
          <q-toggle v-model="showGuitar" label="Guitar" />
          <q-toggle v-model="showStaff" label="Staff" />
        </div>

        <div class="q-gutter-xl">
          <PianoKeyboard v-if="showPiano" />
          <GuitarFretboard v-if="showGuitar" />
          <GrandStaff v-if="showStaff" />
        </div>
      </q-tab-panel>

      <q-tab-panel name="sight-reading">
        <FeaturePlaceholder
          title="Sight Reading"
          text="SRT-style staff drill, MIDI input, scoring, and optional Note Map HUD belong here."
        />
      </q-tab-panel>

      <q-tab-panel name="guitar-tab">
        <FeaturePlaceholder
          title="Guitar TAB"
          text="Tablature generation, fret-position constraints, and note-name drill modes belong here."
        />
      </q-tab-panel>

      <q-tab-panel name="fifths">
        <FeaturePlaceholder
          title="Circle of Fifths"
          text="Interactive key signatures, relative major/minor, diatonic chords, and modulation paths belong here."
        />
      </q-tab-panel>

      <q-tab-panel name="composer">
        <FeaturePlaceholder
          title="Composer"
          text="Chord designer, event timeline, save/playback, MIDI export, and stride-piano generation belong here."
        />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import PitchClassSelector from '../components/PitchClassSelector.vue'
import PianoKeyboard from '../components/PianoKeyboard.vue'
import GuitarFretboard from '../components/GuitarFretboard.vue'
import GrandStaff from '../components/GrandStaff.vue'
import FeaturePlaceholder from '../components/FeaturePlaceholder.vue'

const activeTab = ref('note-map')
const showPiano = ref(true)
const showGuitar = ref(true)
const showStaff = ref(true)
</script>

<style scoped>
.music-workspace {
  max-width: 1180px;
  margin: 0 auto;
}
</style>
