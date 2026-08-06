<template>
  <section class="object-order" aria-label="Arrange visible workspace components">
    <div class="reset-row">
      <q-btn flat dense round size="sm" icon="restart_alt" aria-label="Restore default component order" @click="store.resetComponentOrder">
        <q-tooltip v-if="store.tooltipsEnabled">Restore control panel, player staff, piano, and guitar to the default order.</q-tooltip>
      </q-btn>
    </div>

    <div class="order-list">
      <div
        v-for="(id, index) in store.componentOrder"
        :key="id"
        class="order-row"
        :class="{ dragging: draggingId === id, 'drop-target': overId === id }"
        @dragover.prevent="overId = id"
        @dragleave="overId = null"
        @drop.prevent="dropOn(id)"
      >
        <div class="drag-handle" draggable="true" @dragstart="startDrag($event, id)" @dragend="finishDrag">
          <q-icon name="drag_indicator" size="18px" />
          <q-tooltip v-if="store.tooltipsEnabled">Drag {{ metadata[id].label }} to a new position.</q-tooltip>
        </div>

        <div class="object-icon-wrap">
          <q-icon :name="metadata[id].icon" size="21px" class="object-icon" />
          <q-tooltip v-if="store.tooltipsEnabled">{{ metadata[id].label }}</q-tooltip>
        </div>

        <q-toggle
          :model-value="store.visibleObjects[id]"
          dense
          size="sm"
          color="grey-5"
          aria-label="Toggle component visibility"
          @update:model-value="store.setVisibleObject(id, $event)"
        >
          <q-tooltip v-if="store.tooltipsEnabled">Show or hide {{ metadata[id].label }}.</q-tooltip>
        </q-toggle>

        <q-btn flat dense round size="sm" icon="keyboard_arrow_up" :disable="index === 0" aria-label="Move component up" @click="store.moveComponentBy(id, -1)">
          <q-tooltip v-if="store.tooltipsEnabled">Move {{ metadata[id].label }} up.</q-tooltip>
        </q-btn>
        <q-btn flat dense round size="sm" icon="keyboard_arrow_down" :disable="index === store.componentOrder.length - 1" aria-label="Move component down" @click="store.moveComponentBy(id, 1)">
          <q-tooltip v-if="store.tooltipsEnabled">Move {{ metadata[id].label }} down.</q-tooltip>
        </q-btn>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const draggingId = ref(null)
const overId = ref(null)

const metadata = {
  controls: { label: 'Control panel', icon: 'tune' },
  piano: { label: 'Piano keyboard', icon: 'piano' },
  guitar: { label: 'Guitar neck', icon: 'linear_scale' },
  staff: { label: 'Player staff', icon: 'music_note' }
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
.object-order { color: #fff; padding: 5px 10px 12px; }
.reset-row { display: flex; justify-content: flex-end; padding: 2px 2px 5px; }
.order-list { display: grid; gap: 2px; }
.order-row {
  display: grid;
  grid-template-columns: 34px 1fr auto 34px 34px;
  align-items: center;
  min-height: 44px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  transition: background 120ms ease, opacity 120ms ease;
}
.order-row:hover { background: rgba(255,255,255,.055); }
.order-row.drop-target { background: rgba(255,255,255,.12); }
.order-row.dragging { opacity: 0.48; }
.drag-handle { display: grid; place-items: center; width: 100%; height: 100%; color: #aeb6bc; cursor: grab; user-select: none; }
.drag-handle:active { cursor: grabbing; }
.object-icon-wrap { display: grid; place-items: start; width: 100%; padding-left: 7px; }
.object-icon { color: #e1e1e1; }
.order-row :deep(.q-toggle) { justify-self: center; }
</style>
