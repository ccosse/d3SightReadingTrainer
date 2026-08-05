<template>
  <q-layout view="hHh Lpr lFf" class="app-shell">
    <q-header class="app-header text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Toggle left navigation"
          @click="store.leftDrawerOpen = !store.leftDrawerOpen"
        >
          <q-tooltip>Show or hide the workspace and instrument-visibility sidebar.</q-tooltip>
        </q-btn>

        <q-toolbar-title>
          <span class="text-weight-medium">d3 Sight Reading Trainer</span>
          <span class="text-caption text-grey-4 q-ml-sm">integrated music workspace</span>
        </q-toolbar-title>

        <div class="text-caption gt-sm q-mr-md">
          {{ store.currentKey.label }} major · {{ store.selectedSummary }}
        </div>

        <q-btn
          flat
          dense
          round
          icon="donut_large"
          aria-label="Toggle Circle of Fifths overlay"
          @click="store.rightDrawerOpen = !store.rightDrawerOpen"
        >
          <q-tooltip>Show or hide the transparent, linked Circle of Fifths panel.</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="store.leftDrawerOpen"
      show-if-above
      bordered
      :width="218"
      :breakpoint="900"
      class="dark-drawer text-white"
    >
      <div class="drawer-title">Workspace</div>
      <q-list padding dark>
        <q-item
          v-for="item in navigation"
          :key="item.name"
          clickable
          v-ripple
          :active="store.activeTab === item.name"
          active-class="active-nav"
          @click="store.activeTab = item.name"
        >
          <q-tooltip anchor="center right" self="center left">{{ item.tooltip }}</q-tooltip>
          <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
      </q-list>

      <q-separator dark />
      <div class="drawer-section">
        <div class="text-caption text-grey-5 q-mb-sm">Visible objects</div>
        <q-toggle v-model="store.visibleObjects.piano" dense label="Piano keyboard" class="full-width">
          <q-tooltip>Show or hide the linked scalable piano keyboard.</q-tooltip>
        </q-toggle>
        <q-toggle v-model="store.visibleObjects.guitar" dense label="Guitar neck" class="full-width">
          <q-tooltip>Show or hide the linked 24-position Stratocaster fretboard.</q-tooltip>
        </q-toggle>
        <q-toggle v-model="store.visibleObjects.staff" dense label="Grand staff" class="full-width">
          <q-tooltip>Show or hide the linked bass-and-treble grand staff.</q-tooltip>
        </q-toggle>
      </div>
    </q-drawer>

    <q-drawer
      v-if="store.activeTab === 'note-map'"
      v-model="store.rightDrawerOpen"
      side="right"
      overlay
      bordered
      :width="410"
      :breakpoint="1120"
      class="fifths-overlay text-white"
      style="background: rgba(28, 28, 28, 0.93); backdrop-filter: blur(8px);"
    >
      <q-scroll-area class="fit">
        <div class="overlay-header row items-center justify-between">
          <div>
            <div class="drawer-title q-pa-none">Linked Circle of Fifths</div>
            <div class="text-caption text-grey-5">Click a sector to change the key everywhere.</div>
          </div>
          <q-btn flat dense round icon="close" @click="store.rightDrawerOpen = false">
            <q-tooltip>Close the Circle of Fifths overlay.</q-tooltip>
          </q-btn>
        </div>

        <div class="circle-overlay-body">
          <CircleOfFifths />
          <KeySummary compact />

          <q-separator dark />

          <div>
            <div class="text-caption text-grey-5 q-mb-xs">Pitch selection mode</div>
            <q-btn-toggle
              :model-value="store.selectionMode"
              spread
              unelevated
              toggle-color="primary"
              color="grey-9"
              text-color="white"
              :options="[
                { label: 'Single', value: 'single' },
                { label: 'Multi', value: 'multi' }
              ]"
              @update:model-value="store.setSelectionMode"
            >
              <q-tooltip>
                Single selects one pitch class at a time; Multi builds chords and note collections.
              </q-tooltip>
            </q-btn-toggle>
          </div>

          <div>
            <div class="text-caption text-grey-5 q-mb-xs">Note spelling</div>
            <q-btn-toggle
              v-model="store.accidentalMode"
              spread
              unelevated
              toggle-color="primary"
              color="grey-9"
              text-color="white"
              :options="[
                { label: 'Flats ♭', value: 'flat' },
                { label: 'Sharps ♯', value: 'sharp' }
              ]"
            >
              <q-tooltip>Use flat or sharp names throughout all linked views.</q-tooltip>
            </q-btn-toggle>
          </div>

          <q-toggle v-model="store.showKeyOverlay" dense label="Overlay current key" color="positive">
            <q-tooltip>
              Highlight every pitch class in the current major key on the piano, fretboard, and staff.
            </q-tooltip>
          </q-toggle>

          <q-toggle v-model="store.keySelectsTonic" dense label="Key click selects tonic">
            <q-tooltip>
              In Single mode, clicking a Circle of Fifths key also makes that key's tonic the selected note.
            </q-tooltip>
          </q-toggle>

          <q-toggle v-model="store.showAllNoteNames" dense label="Show all fretboard names">
            <q-tooltip>
              Show every fretboard note name. Turn off to show only selected notes and the optional key overlay.
            </q-tooltip>
          </q-toggle>
        </div>
      </q-scroll-area>
    </q-drawer>

    <q-page-container class="page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import CircleOfFifths from '../components/CircleOfFifths.vue'
import KeySummary from '../components/KeySummary.vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const navigation = [
  { name: 'note-map', label: 'Note Map', icon: 'grid_on', tooltip: 'Explore notes across keyboard, fretboard, staff, keys, and Circle of Fifths.' },
  { name: 'sight-reading', label: 'Sight Reading', icon: 'music_note', tooltip: 'Open the future MIDI sight-reading drill workspace.' },
  { name: 'guitar-tab', label: 'Guitar TAB', icon: 'linear_scale', tooltip: 'Open the future linked guitar-tablature workspace.' },
  { name: 'fifths', label: 'Circle of Fifths', icon: 'donut_large', tooltip: 'Open the Circle of Fifths in a full-width study view.' },
  { name: 'composer', label: 'Composer', icon: 'edit_note', tooltip: 'Open the future chord, playback, and accompaniment workspace.' }
]
</script>

<style scoped>
.app-shell, .page-container { background: #333; color: white; }
.app-header { background: #292929; border-bottom: 1px solid #555; }
.dark-drawer { background: #303030; color: white; }
.drawer-title { color: #b9dfff; font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; }
.dark-drawer .drawer-title { padding: 18px 16px 8px; }
.drawer-section { padding: 16px; display: grid; gap: 8px; }
.active-nav { color: white; background: #175f8f; }
.overlay-header { padding: 14px 14px 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.14); }
.circle-overlay-body { display: grid; gap: 15px; padding: 10px 14px 22px; }
.fifths-overlay { color: white; box-shadow: -8px 0 28px rgba(0, 0, 0, 0.35); }
</style>
