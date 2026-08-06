<template>
  <q-page class="music-workspace">
    <q-tab-panels v-model="store.activeTab" animated keep-alive class="workspace-panels">
      <q-tab-panel name="note-map" class="q-pa-none">
        <div class="instrument-stack">
          <div
            v-for="item in orderedComponents"
            v-show="store.visibleObjects[item.id]"
            :key="item.id"
            class="component-shell"
            :class="{ dragging: draggingId === item.id, 'drop-target': overId === item.id }"
            @dragover.prevent="overId = item.id"
            @dragleave="overId = null"
            @drop.prevent="dropOn(item.id)"
          >
            <div
              class="component-drag-handle"
              draggable="true"
              @dragstart="startDrag($event, item.id)"
              @dragend="finishDrag"
            >
              <q-icon name="drag_indicator" size="18px" />
              <q-tooltip v-if="store.tooltipsEnabled">Drag to reorder {{ item.label }}. Arrow controls are also available in the left sidebar.</q-tooltip>
            </div>
            <component :is="item.component" />
          </div>
        </div>

      </q-tab-panel>


      <q-tab-panel name="guitar-tab" class="q-pa-none">
        <FeaturePlaceholder
          title="Guitar TAB"
          text="Scrolling tablature, position constraints, string/fret recognition, and keyboard correspondence will live here."
        />
      </q-tab-panel>

      <q-tab-panel name="fifths" class="q-pa-none">
        <div class="fifths-study">
          <FifthsExplorer />
          <GuitarExplorerControls />
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
import { computed, ref } from 'vue'
import FeaturePlaceholder from '../components/FeaturePlaceholder.vue'
import FifthsExplorer from '../components/FifthsExplorer.vue'
import GuitarExplorerControls from '../components/GuitarExplorerControls.vue'
import PianoKeyboard from '../components/PianoKeyboard.vue'
import PitchClassSelector from '../components/PitchClassSelector.vue'
import StratocasterFretboard from '../components/StratocasterFretboard.vue'
import ScrollingSightReader from '../components/ScrollingSightReader.vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const draggingId = ref(null)
const overId = ref(null)

const registry = {
  controls: { id: 'controls', label: 'control panel', component: PitchClassSelector },
  piano: { id: 'piano', label: 'piano keyboard', component: PianoKeyboard },
  guitar: { id: 'guitar', label: 'guitar neck', component: StratocasterFretboard },
  staff: { id: 'staff', label: 'player staff', component: ScrollingSightReader }
}

const orderedComponents = computed(() => store.componentOrder.map((id) => registry[id]).filter(Boolean))

function startDrag(event, id) {
  draggingId.value = id
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', id)
}

function finishDrag() {
  draggingId.value = null
  overId.value = null
}

function dropOn(targetId) {
  if (draggingId.value) store.moveComponent(draggingId.value, targetId)
  finishDrag()
}
</script>

<style scoped>
.music-workspace {
  width: min(1080px, 100%);
  max-width: 1080px;
  margin: 0 auto;
  padding: 8px 10px 24px;
  background: #333;
  color: white;
}
.workspace-panels { background: transparent; color: white; }
.instrument-stack { display: grid; gap: 8px; }
.component-shell {
  position: relative;
  border: 1px solid #494949;
  border-radius: 8px;
  background: #2b2b2b;
  padding: 5px;
  transition: border-color 120ms ease, opacity 120ms ease, background 120ms ease;
}
.component-shell.drop-target { border-color: #77c4ff; background: #30383d; }
.component-shell.dragging { opacity: 0.48; }
.component-drag-handle {
  position: absolute;
  z-index: 4;
  top: 5px;
  right: 5px;
  width: 27px;
  height: 27px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #d5d5d5;
  background: rgba(20, 20, 20, 0.58);
  opacity: 0.34;
  cursor: grab;
  user-select: none;
  transition: opacity 120ms ease, background 120ms ease;
}
.component-shell:hover .component-drag-handle,
.component-drag-handle:focus { opacity: 0.95; background: rgba(20, 20, 20, 0.86); }
.component-drag-handle:active { cursor: grabbing; }
.fifths-study { display: grid; gap: 14px; max-width: 1120px; margin: 0 auto; }

@media (max-width: 880px) {
  .music-workspace { padding-inline: 8px; }
}
</style>
