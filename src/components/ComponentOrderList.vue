<template>
  <section class="object-order">
    <div class="row items-center justify-between q-px-md q-pt-md q-pb-xs">
      <div class="drawer-title">Arrange views</div>
      <q-btn flat dense round size="sm" icon="restart_alt" @click="store.resetComponentOrder">
        <q-tooltip>Restore the default control-panel, keyboard, fretboard, staff order.</q-tooltip>
      </q-btn>
    </div>

    <div class="text-caption text-grey-5 q-px-md q-pb-sm">
      Drag a handle or use the arrows. Changes appear immediately.
    </div>

    <div class="order-list q-px-sm q-pb-md">
      <div
        v-for="(id, index) in store.componentOrder"
        :key="id"
        class="order-row"
        :class="{ dragging: draggingId === id, 'drop-target': overId === id }"
        @dragover.prevent="overId = id"
        @dragleave="overId = null"
        @drop.prevent="dropOn(id)"
      >
        <div
          class="drag-handle"
          draggable="true"
          @dragstart="startDrag($event, id)"
          @dragend="finishDrag"
        >
          <q-icon name="drag_indicator" size="20px" />
          <q-tooltip>Drag {{ metadata[id].label }} to a new position.</q-tooltip>
        </div>

        <q-icon :name="metadata[id].icon" size="18px" class="object-icon" />
        <span class="object-label">{{ metadata[id].label }}</span>

        <q-btn
          flat
          dense
          round
          size="sm"
          icon="keyboard_arrow_up"
          :disable="index === 0"
          @click="store.moveComponentBy(id, -1)"
        >
          <q-tooltip>Move {{ metadata[id].label }} up.</q-tooltip>
        </q-btn>
        <q-btn
          flat
          dense
          round
          size="sm"
          icon="keyboard_arrow_down"
          :disable="index === store.componentOrder.length - 1"
          @click="store.moveComponentBy(id, 1)"
        >
          <q-tooltip>Move {{ metadata[id].label }} down.</q-tooltip>
        </q-btn>

        <q-toggle
          :model-value="store.visibleObjects[id]"
          dense
          size="sm"
          @update:model-value="store.setVisibleObject(id, $event)"
        >
          <q-tooltip>Show or hide {{ metadata[id].label }}.</q-tooltip>
        </q-toggle>
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
.object-order { color: #fff; }
.drawer-title { color: #b9dfff; font-size: 1.05rem; letter-spacing: 0.08em; text-transform: uppercase; }
.order-list { display: grid; gap: 5px; }
.order-row {
  display: grid;
  grid-template-columns: 28px 24px minmax(0, 1fr) 30px 30px 38px;
  align-items: center;
  min-height: 42px;
  border: 1px solid #4d4d4d;
  border-radius: 7px;
  background: #292929;
  transition: border-color 120ms ease, background 120ms ease, opacity 120ms ease;
}
.order-row.drop-target { border-color: #77c4ff; background: #303b42; }
.order-row.dragging { opacity: 0.48; }
.drag-handle {
  display: grid;
  place-items: center;
  height: 100%;
  color: #aeb6bc;
  cursor: grab;
  user-select: none;
}
.drag-handle:active { cursor: grabbing; }
.object-icon { color: #8fd0ff; }
.object-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
