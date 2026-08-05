<template>
  <q-layout view="hHh Lpr lFf" class="app-shell">
    <q-header class="app-header text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Toggle left navigation" @click="store.leftDrawerOpen = !store.leftDrawerOpen" />
        <q-toolbar-title>
          <span class="text-weight-medium">d3 Sight Reading Trainer</span>
          <span class="text-caption text-grey-4 q-ml-sm">integrated music workspace</span>
        </q-toolbar-title>
        <div class="text-caption gt-sm q-mr-md">{{ store.currentKey.label }} major · {{ store.selectedSummary }}</div>
        <q-btn flat dense round icon="tune" aria-label="Toggle right controls" @click="store.rightDrawerOpen = !store.rightDrawerOpen" />
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
          <q-item-section avatar><q-icon :name="item.icon" /></q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
      </q-list>

      <q-separator dark />
      <div class="drawer-section">
        <div class="text-caption text-grey-5 q-mb-sm">Visible objects</div>
        <q-toggle v-model="store.visibleObjects.piano" dense label="Piano keyboard" class="full-width" />
        <q-toggle v-model="store.visibleObjects.guitar" dense label="Guitar neck" class="full-width" />
        <q-toggle v-model="store.visibleObjects.staff" dense label="Grand staff" class="full-width" />
      </div>
    </q-drawer>

    <q-drawer
      v-model="store.rightDrawerOpen"
      side="right"
      show-if-above
      bordered
      :width="270"
      :breakpoint="1120"
      class="dark-drawer text-white"
    >
      <div class="drawer-title">Linked controls</div>
      <div class="drawer-section q-gutter-md">
        <q-select
          :model-value="store.currentKeyId"
          :options="store.keyOptions"
          emit-value
          map-options
          dark
          dense
          outlined
          label="Major key"
          @update:model-value="store.setKey"
        />

        <div>
          <div class="text-caption text-grey-5 q-mb-xs">Pitch selection</div>
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
          />
        </div>

        <q-toggle v-model="store.showKeyOverlay" dense label="Overlay current key" color="positive" />
        <q-toggle v-model="store.keySelectsTonic" dense label="Key selection follows tonic" />
        <q-toggle v-model="store.showAllNoteNames" dense label="Show all fretboard names" />

        <q-separator dark />
        <div>
          <div class="text-subtitle2">{{ store.currentKey.label }} major</div>
          <div class="text-caption text-grey-4">{{ store.keySignatureSummary }}</div>
          <div class="text-caption text-grey-4">Relative {{ store.currentKey.relativeMinor }}</div>
          <div class="text-caption text-light-blue-2 q-mt-sm">{{ store.currentKey.scale.join(' · ') }}</div>
        </div>

        <q-btn
          outline
          color="light-blue-3"
          label="Open Circle of Fifths"
          no-caps
          class="full-width"
          @click="store.activeTab = 'fifths'"
        />
      </div>
    </q-drawer>

    <q-page-container class="page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const navigation = [
  { name: 'note-map', label: 'Note Map', icon: 'grid_on' },
  { name: 'sight-reading', label: 'Sight Reading', icon: 'music_note' },
  { name: 'guitar-tab', label: 'Guitar TAB', icon: 'linear_scale' },
  { name: 'fifths', label: 'Circle of Fifths', icon: 'donut_large' },
  { name: 'composer', label: 'Composer', icon: 'edit_note' }
]
</script>

<style scoped>
.app-shell, .page-container { background: #333; color: white; }
.app-header { background: #292929; border-bottom: 1px solid #555; }
.dark-drawer { background: #303030; color: white; }
.drawer-title { padding: 18px 16px 8px; color: #b9dfff; font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; }
.drawer-section { padding: 16px; display: grid; gap: 8px; }
.active-nav { color: white; background: #175f8f; }
</style>
