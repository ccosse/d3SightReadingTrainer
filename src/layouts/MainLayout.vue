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
          {{ store.currentMode === 'minor' ? store.currentMinorLabel : store.currentKey.label + ' major' }} · {{ store.keySignatureSummary }} · {{ store.selectedSummary }}
        </div>

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
      v-if="showFifthsTools"
      v-model="store.rightDrawerOpen"
      side="right"
      overlay
      bordered
      :width="rightDrawerWidth"
      :breakpoint="1120"
      class="fifths-overlay text-white"
      style="background: rgba(18, 18, 18, 0.88); color: #fff; backdrop-filter: blur(10px) saturate(108%);"
    >
      <q-scroll-area class="fit">
        <div class="circle-overlay-body">
          <q-btn
            class="expand-fifths"
            round
            dense
            flat
            icon="open_in_full"
            color="grey-3"
            aria-label="Open full-screen Circle of Fifths"
            @click="store.fifthsFullscreenOpen = true"
          >
            <q-tooltip>Expand the Circle, signature ladder, and linked controls over the whole workspace.</q-tooltip>
          </q-btn>
          <FifthsExplorer compact />
          <GuitarExplorerControls />
        </div>
      </q-scroll-area>
    </q-drawer>

    <q-btn
      v-if="showFifthsTools"
      class="fifths-edge-tab"
      :style="fifthsEdgeTabStyle"
      unelevated
      :icon="store.rightDrawerOpen ? 'chevron_right' : 'chevron_left'"
      :aria-label="store.rightDrawerOpen ? 'Close Circle of Fifths sidebar' : 'Open Circle of Fifths sidebar'"
      @click="store.rightDrawerOpen = !store.rightDrawerOpen"
    >
      <q-tooltip anchor="center left" self="center right">
        {{ store.rightDrawerOpen ? 'Collapse the linked theory sidebar.' : 'Open the linked Circle of Fifths sidebar.' }}
      </q-tooltip>
    </q-btn>

    <q-dialog
      v-model="store.fifthsFullscreenOpen"
      maximized
      transition-show="fade"
      transition-hide="fade"
    >
      <q-card class="fullscreen-fifths-card text-white">
        <q-btn
          class="fullscreen-close"
          round
          dense
          flat
          icon="close"
          color="grey-2"
          v-close-popup
        >
          <q-tooltip>Close the full-screen theory overlay.</q-tooltip>
        </q-btn>
        <q-scroll-area class="fit">
          <div class="fullscreen-fifths-content">
            <FifthsExplorer />
            <GuitarExplorerControls />
          </div>
        </q-scroll-area>
      </q-card>
    </q-dialog>

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
const showFifthsTools = computed(() => store.activeTab !== 'fifths')
const rightDrawerWidth = computed(() => {
  if ($q.screen.lt.sm) return $q.screen.width
  if ($q.screen.lt.md) return Math.round($q.screen.width * 0.96)
  return Math.min(1140, Math.round($q.screen.width * 0.78))
})
const fifthsEdgeTabStyle = computed(() => ({
  right: store.rightDrawerOpen ? `${Math.max(0, rightDrawerWidth.value - 38)}px` : '0px'
}))

const navigation = [
  { name: 'note-map', label: 'Note Map', icon: 'grid_on', tooltip: 'Explore notes across keyboard, fretboard, staff, keys, and Circle of Fifths.' },
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
.drawer-title { color: #b9dfff; font-size: 1.05rem; letter-spacing: 0.08em; text-transform: uppercase; }
.active-nav { color: white; background: #175f8f; }
.circle-overlay-body { position: relative; display: grid; gap: 10px; padding: 11px 15px 24px; min-height: 100%; }
.expand-fifths { position: absolute; z-index: 6; top: 5px; right: 5px; background: rgba(28, 28, 28, 0.48); }
.fifths-overlay { background: rgba(18, 18, 18, 0.88) !important; color: white; box-shadow: -12px 0 36px rgba(0, 0, 0, 0.38); border-left-color: rgba(255, 255, 255, 0.16) !important; }
.fifths-edge-tab {
  position: fixed;
  z-index: 3200;
  top: 50%;
  width: 38px;
  min-width: 38px;
  height: 92px;
  padding: 0;
  transform: translateY(-50%);
  border-radius: 10px 0 0 10px;
  color: #e8e8e8;
  background: rgba(20, 20, 20, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-right: 0;
  box-shadow: -5px 0 18px rgba(0, 0, 0, 0.32);
  transition: right 180ms ease, background 140ms ease;
}
.fifths-edge-tab:hover { background: rgba(42, 42, 42, 0.97); }
.fullscreen-fifths-card { background: rgba(12, 12, 12, 0.46); backdrop-filter: blur(13px) saturate(118%); }
.fullscreen-fifths-content { width: min(1420px, calc(100vw - 36px)); margin: 0 auto; padding: 42px 18px 34px; display: grid; gap: 14px; }
.fullscreen-close { position: fixed; z-index: 10; top: 10px; right: 12px; background: rgba(20, 20, 20, 0.58); }
</style>
