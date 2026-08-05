<template>
  <q-layout view="hHh Lpr lFf" class="app-shell">
    <q-header class="app-header text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Toggle workspace navigation"
          @click="store.leftDrawerOpen = !store.leftDrawerOpen"
        >
          <q-tooltip>Show or hide navigation and view arrangement.</q-tooltip>
        </q-btn>

        <q-toolbar-title>
          <span class="text-weight-medium">d3 Sight Reading Trainer</span>
          <span class="text-caption text-grey-4 q-ml-sm gt-xs">integrated music workspace</span>
        </q-toolbar-title>

        <div class="text-caption gt-sm q-mr-md">
          {{ store.currentKey.label }} major · {{ store.keySignatureSummary }} · {{ store.selectedSummary }}
        </div>

        <q-btn
          v-if="store.activeTab === 'note-map'"
          flat
          dense
          round
          icon="donut_large"
          aria-label="Toggle Circle of Fifths overlay"
          @click="store.rightDrawerOpen = !store.rightDrawerOpen"
        >
          <q-tooltip>Show or hide the linked Circle of Fifths, key-signature ladder, and d3GuitarExplorer controls.</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="store.leftDrawerOpen"
      show-if-above
      bordered
      :width="264"
      :breakpoint="900"
      class="dark-drawer text-white"
      style="background: #303030; color: #fff;"
    >
      <q-scroll-area class="fit dark-drawer-scroll">
        <div class="drawer-title q-px-md q-pt-lg q-pb-sm">Workspace</div>
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

        <template v-if="store.activeTab === 'note-map'">
          <q-separator dark />
          <ComponentOrderList />
        </template>
      </q-scroll-area>
    </q-drawer>

    <q-drawer
      v-if="store.activeTab === 'note-map'"
      v-model="store.rightDrawerOpen"
      side="right"
      overlay
      bordered
      :width="rightDrawerWidth"
      :breakpoint="1120"
      class="fifths-overlay text-white"
      style="background: rgba(28, 28, 28, 0.95); color: #fff; backdrop-filter: blur(8px);"
    >
      <q-scroll-area class="fit">
        <div class="circle-overlay-body">
          <FifthsExplorer compact />
          <GuitarExplorerControls />
        </div>
      </q-scroll-area>
    </q-drawer>

    <q-page-container class="page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import ComponentOrderList from '../components/ComponentOrderList.vue'
import FifthsExplorer from '../components/FifthsExplorer.vue'
import GuitarExplorerControls from '../components/GuitarExplorerControls.vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const $q = useQuasar()
const rightDrawerWidth = computed(() => {
  if ($q.screen.lt.sm) return Math.min($q.screen.width, 380)
  if ($q.screen.lt.lg) return 590
  return 690
})

const navigation = [
  { name: 'note-map', label: 'Note Map', icon: 'grid_on', tooltip: 'Explore notes across keyboard, fretboard, staff, keys, and Circle of Fifths.' },
  { name: 'sight-reading', label: 'Sight Reading', icon: 'music_note', tooltip: 'Open the future MIDI sight-reading drill workspace.' },
  { name: 'guitar-tab', label: 'Guitar TAB', icon: 'linear_scale', tooltip: 'Open the future linked guitar-tablature workspace.' },
  { name: 'fifths', label: 'Circle of Fifths', icon: 'donut_large', tooltip: 'Open the Circle, key-signature ladder, and linked controls in a full-width study view.' },
  { name: 'composer', label: 'Composer', icon: 'edit_note', tooltip: 'Open the future chord, playback, and accompaniment workspace.' }
]
</script>

<style scoped>
.app-shell, .page-container { background: #333; color: white; }
.app-header { background: #292929; border-bottom: 1px solid #555; }
.dark-drawer { background: #303030 !important; color: white !important; }
.dark-drawer-scroll { background: #303030; color: #fff; }
.drawer-title { color: #b9dfff; font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; }
.active-nav { color: white; background: #175f8f; }
.circle-overlay-body { display: grid; gap: 12px; padding: 10px 12px 22px; }
.fifths-overlay { color: white; box-shadow: -8px 0 28px rgba(0, 0, 0, 0.35); }
</style>
