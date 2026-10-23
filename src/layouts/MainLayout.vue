<template>
  <q-layout view="hHh Lpr lFf" class="app-shell">
    <q-header class="app-header">
      <div v-if="isUnified" class="unified-app-header">
        <span class="unified-brand">d3SRT + Cosmic Harmony</span>

      </div>
      <div v-else class="blank-header" />
    </q-header>

    <q-drawer
      v-if="!isUnified"
      v-model="store.leftDrawerOpen"
      :overlay="leftDrawerOverlay"
      :behavior="leftDrawerOverlay ? 'mobile' : 'desktop'"
      bordered
      :width="leftDrawerWidth"
      :breakpoint="1180"
      class="dark-drawer text-white"
      style="background: #303030; color: #fff;"
    >
      <q-scroll-area class="fit dark-drawer-scroll">
        <div class="left-drawer-column">
          <div class="left-drawer-tools">
            <q-btn class="unified-launch" dense flat no-caps icon="dashboard_customize" label="Unified workspace preview" to="/unified" />
            <ComponentOrderList />

          </div>

          <a
            class="brand-mark"
            href="https://www.asymptopia.com/"
            target="_blank"
            rel="author noopener noreferrer"
            aria-label="Open Asymptopia Software in a new tab"
          >
            <img src="../assets/asymptopia_logo.png" alt="Asymptopia logo" />
            <q-tooltip v-if="store.tooltipsEnabled" anchor="center right" self="center left">Open asymptopia.com</q-tooltip>
          </a>
        </div>
      </q-scroll-area>
    </q-drawer>

    <q-btn
      v-if="!isUnified"
      class="left-edge-tab"
      :style="leftEdgeTabStyle"
      unelevated
      :icon="store.leftDrawerOpen ? 'chevron_left' : 'chevron_right'"
      :aria-label="store.leftDrawerOpen ? 'Close workspace sidebar' : 'Open workspace sidebar'"
      @click="store.leftDrawerOpen = !store.leftDrawerOpen"
    >
      <q-tooltip v-if="store.tooltipsEnabled" anchor="center right" self="center left">
        {{ store.leftDrawerOpen ? 'Collapse the workspace sidebar.' : 'Open workspace controls and view arrangement.' }}
      </q-tooltip>
    </q-btn>

    <q-drawer
      v-if="!isUnified && showFifthsTools"
      v-model="store.rightDrawerOpen"
      side="right"
      :overlay="rightDrawerOverlay"
      :behavior="rightDrawerOverlay ? 'mobile' : 'desktop'"
      :show-if-above="!rightDrawerOverlay"
      bordered
      :width="rightDrawerWidth"
      :breakpoint="1380"
      class="fifths-overlay text-white"
      style="background: rgba(18, 18, 18, 0.86); color: #fff; backdrop-filter: blur(10px) saturate(108%);"
    >
      <q-scroll-area class="fit">
        <div class="circle-overlay-body">
          <q-btn
            v-if="canDock"
            class="drawer-mode-toggle"
            round
            dense
            flat
            :icon="store.rightDrawerMode === 'dock' ? 'layers' : 'view_sidebar'"
            color="grey-3"
            :aria-label="store.rightDrawerMode === 'dock' ? 'Use overlay theory panel' : 'Dock theory panel beside workspace'"
            @click="store.toggleRightDrawerMode"
          >
            <q-tooltip v-if="store.tooltipsEnabled">{{ store.rightDrawerMode === 'dock' ? 'Overlay the theory panel without resizing the workspace.' : 'Dock the theory panel and push the workspace left.' }}</q-tooltip>
          </q-btn>
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
            <q-tooltip v-if="store.tooltipsEnabled">Expand the Circle, signature ladder, and linked controls over the whole workspace.</q-tooltip>
          </q-btn>
          <FifthsExplorer compact :stacked="!rightDrawerOverlay" />
          <TheoryControls />
        </div>
      </q-scroll-area>
    </q-drawer>

    <q-btn
      v-if="!isUnified && showFifthsTools"
      class="fifths-edge-tab"
      :style="fifthsEdgeTabStyle"
      unelevated
      :icon="store.rightDrawerOpen ? 'chevron_right' : 'chevron_left'"
      :aria-label="store.rightDrawerOpen ? 'Close Circle of Fifths sidebar' : 'Open Circle of Fifths sidebar'"
      @click="store.rightDrawerOpen = !store.rightDrawerOpen"
    >
      <q-tooltip v-if="store.tooltipsEnabled" anchor="center left" self="center right">
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
          <q-tooltip v-if="store.tooltipsEnabled">Close the full-screen theory overlay.</q-tooltip>
        </q-btn>
        <q-scroll-area class="fit">
          <div class="fullscreen-fifths-content">
            <FifthsExplorer />
            <TheoryControls />
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
import { useRoute } from 'vue-router'
import ComponentOrderList from '../components/ComponentOrderList.vue'
import FifthsExplorer from '../components/FifthsExplorer.vue'
import TheoryControls from '../components/TheoryControls.vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const $q = useQuasar()
const route = useRoute()
const isUnified = computed(() => route.path === '/unified')
const desktopDrawerWidth = 350
const stableWorkspaceWidth = 900
const drawerWidth = computed(() => $q.screen.lt.sm ? Math.min(340, Math.round($q.screen.width * 0.92)) : desktopDrawerWidth)
const leftDrawerWidth = drawerWidth
// On desktop the workspace drawer occupies its own column. Phones and tablets
// keep the slide-over behavior so the staff remains usable on small screens.
const leftDrawerOverlay = computed(() => $q.screen.width < 1100)
const showFifthsTools = computed(() => true)
const reservedLeftWidth = computed(() => store.leftDrawerOpen && !leftDrawerOverlay.value ? desktopDrawerWidth : 0)
const canDock = computed(() => $q.screen.width >= stableWorkspaceWidth + desktopDrawerWidth + reservedLeftWidth.value + 16)
const rightDrawerOverlay = computed(() => !canDock.value || store.rightDrawerMode === 'overlay')
const rightDrawerWidth = computed(() => {
  if (!rightDrawerOverlay.value) return desktopDrawerWidth
  return drawerWidth.value
})
const leftEdgeTabStyle = computed(() => ({
  // The tab begins exactly at the drawer edge and projects over the music area.
  // No spacer column is reserved between the drawer and the instrument stack.
  left: store.leftDrawerOpen ? `${Math.max(0, leftDrawerWidth.value - 1)}px` : '0px'
}))
const fifthsEdgeTabStyle = computed(() => ({
  // Mirror the left tab: touch the theory drawer and overlap the staff area.
  right: store.rightDrawerOpen ? `${Math.max(0, rightDrawerWidth.value - 1)}px` : '0px'
}))

</script>

<style scoped>
.app-shell, .page-container { background: #333; color: white; }
.app-header { background: #292929; border-bottom: 0; }
.blank-header { height: 8px; }
.unified-app-header { display:flex; align-items:center; gap:10px; min-height:44px; padding:4px 12px; }
.unified-brand { font-size:14px; font-weight:700; color:#cee2e7; }
.unified-launch { width:100%; color:#bcebd1; border-bottom:1px solid #4b4b4b; border-radius:0; }
.dark-drawer { background: #303030 !important; color: white !important; }
.dark-drawer-scroll { background: #303030; color: #fff; }
.left-drawer-column { min-height: 100%; display: flex; flex-direction: column; }
.left-drawer-tools { flex: 1 1 auto; }
.brand-mark {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  padding: 12px 22px 16px;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}
.brand-mark:visited { color: inherit; }
.brand-mark img {
  display: block;
  width: 216px;
  height: 80px;
  max-width: 100%;
}
.circle-overlay-body { position: relative; display: grid; gap: 10px; padding: 11px 15px 24px; min-height: 100%; }
.expand-fifths { position: absolute; z-index: 6; top: 5px; right: 5px; background: rgba(28, 28, 28, 0.48); }
.drawer-mode-toggle { position: absolute; z-index: 6; top: 5px; right: 45px; background: rgba(28, 28, 28, 0.48); }
.fifths-overlay { background: rgba(18, 18, 18, 0.86) !important; color: white; box-shadow: -8px 0 24px rgba(0, 0, 0, 0.28); border-left-color: rgba(255, 255, 255, 0.10) !important; }
.left-edge-tab,
.fifths-edge-tab {
  position: fixed;
  z-index: 3200;
  top: 50%;
  width: 38px;
  min-width: 38px;
  height: 92px;
  padding: 0;
  transform: translateY(-50%);
  color: #e8e8e8;
  background: rgba(20, 20, 20, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 0 18px rgba(0, 0, 0, 0.32);
  transition: left 180ms ease, right 180ms ease, background 140ms ease;
}
.left-edge-tab { border-radius: 0 10px 10px 0; border-left: 0; }
.fifths-edge-tab { border-radius: 10px 0 0 10px; border-right: 0; }
.left-edge-tab:hover,
.fifths-edge-tab:hover { background: rgba(42, 42, 42, 0.97); }
.fullscreen-fifths-card { background: rgba(12, 12, 12, 0.46); backdrop-filter: blur(13px) saturate(118%); }
.fullscreen-fifths-content { width: min(1420px, calc(100vw - 36px)); margin: 0 auto; padding: 42px 18px 34px; display: grid; gap: 14px; }
.fullscreen-close { position: fixed; z-index: 10; top: 10px; right: 12px; background: rgba(20, 20, 20, 0.58); }
</style>
