<template>
  <section class="object-order" aria-label="Arrange visible workspace components and open their controls">
    <div class="reset-row">
      <q-btn flat dense round size="sm" icon="restart_alt" aria-label="Restore default component order" @click="store.resetComponentOrder">
        <q-tooltip v-if="store.tooltipsEnabled">Restore Controls, Staff, Piano, and Guitar to the default order.</q-tooltip>
      </q-btn>
    </div>

    <div class="order-list">
      <div
        v-for="(id, index) in store.componentOrder"
        :key="id"
        class="order-block"
        :class="{ dragging: draggingId === id, 'drop-target': overId === id }"
        @dragover.prevent="overId = id"
        @dragleave="overId = null"
        @drop.prevent="dropOn(id)"
      >
        <div class="order-row">
          <div class="drag-handle" draggable="true" @dragstart="startDrag($event, id)" @dragend="finishDrag">
            <q-icon name="drag_indicator" size="17px" />
            <q-tooltip v-if="store.tooltipsEnabled">Drag {{ metadata[id].label }} to a new position.</q-tooltip>
          </div>

          <button class="section-name" type="button" @click="toggleSettings(id)">
            <span>{{ metadata[id].label }}</span>
            <q-icon :name="expandedId === id ? 'expand_less' : 'expand_more'" size="18px" />
            <q-tooltip v-if="store.tooltipsEnabled">{{ expandedId === id ? 'Close' : 'Open' }} {{ metadata[id].label }} settings.</q-tooltip>
          </button>

          <ImageCheckbox
            class="object-toggle"
            :model-value="store.visibleObjects[id]"
            label=""
            :tooltip="`Show or hide ${metadata[id].label}.`"
            @update:model-value="store.setVisibleObject(id, $event)"
          />

          <q-btn flat dense round size="sm" icon="keyboard_arrow_up" :disable="index === 0" :aria-label="`Move ${metadata[id].label} up`" @click="store.moveComponentBy(id, -1)">
            <q-tooltip v-if="store.tooltipsEnabled">Move {{ metadata[id].label }} up.</q-tooltip>
          </q-btn>
          <q-btn flat dense round size="sm" icon="keyboard_arrow_down" :disable="index === store.componentOrder.length - 1" :aria-label="`Move ${metadata[id].label} down`" @click="store.moveComponentBy(id, 1)">
            <q-tooltip v-if="store.tooltipsEnabled">Move {{ metadata[id].label }} down.</q-tooltip>
          </q-btn>
        </div>

        <q-slide-transition>
          <div v-show="expandedId === id" class="settings-slot">
            <SidebarControlsSettings v-if="id === 'controls'" />
            <SidebarStaffSettings v-else-if="id === 'staff'" />
            <SidebarPianoSettings v-else-if="id === 'piano'" />
            <SidebarGuitarSettings v-else-if="id === 'guitar'" />
          </div>
        </q-slide-transition>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import ImageCheckbox from './ImageCheckbox.vue'
import SidebarControlsSettings from './SidebarControlsSettings.vue'
import SidebarStaffSettings from './SidebarStaffSettings.vue'
import SidebarPianoSettings from './SidebarPianoSettings.vue'
import SidebarGuitarSettings from './SidebarGuitarSettings.vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const draggingId = ref(null)
const overId = ref(null)
const expandedId = ref('controls')

const metadata = {
  controls: { label: 'Controls' },
  staff: { label: 'Staff' },
  piano: { label: 'Piano' },
  guitar: { label: 'Guitar' }
}

function toggleSettings(id) {
  expandedId.value = expandedId.value === id ? null : id
}

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
.object-order { color: #fff; padding: 5px 8px 12px; }
.reset-row { display: flex; justify-content: flex-end; padding: 2px 2px 4px; }
.order-list { display: grid; gap: 2px; }
.order-block { border-radius: 6px; transition: background 120ms ease, opacity 120ms ease; }
.order-block:hover { background: rgba(255,255,255,.045); }
.order-block.drop-target { background: rgba(72,254,58,.08); }
.order-block.dragging { opacity: 0.48; }
.order-row {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) 26px 28px 28px;
  align-items: center;
  min-height: 42px;
}
.drag-handle { display: grid; place-items: center; width: 100%; height: 100%; color: #aeb6bc; cursor: grab; user-select: none; }
.drag-handle:active { cursor: grabbing; }
.section-name {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  padding: 0 3px;
  border: 0;
  color: #fff;
  background: transparent;
  font: inherit;
  font-weight: 800;
  text-align: left;
  cursor: pointer;
}
.section-name span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.object-toggle { justify-self: center; }
.object-toggle :deep(.image-checkbox) { min-height: 22px; }
.settings-slot { padding: 4px 3px 10px; }
</style>
