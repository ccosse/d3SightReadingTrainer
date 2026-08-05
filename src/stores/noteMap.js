import { defineStore } from 'pinia'
import {
  FLAT_NAMES,
  MAJOR_KEYS,
  SHARP_NAMES,
  keyById,
  keyPitchClasses,
  mod12,
  signatureLabel
} from '../music/theory'

const DEFAULT_COMPONENT_ORDER = ['piano', 'guitar', 'staff']

export const useNoteMapStore = defineStore('noteMap', {
  state: () => ({
    activeTab: 'note-map',
    selectedPitchClasses: [7],
    selectionMode: 'single',
    accidentalMode: 'sharp',
    currentKeyId: 'C',
    showKeyOverlay: false,
    keySelectsTonic: true,
    showAllNoteNames: true,
    visibleObjects: {
      piano: true,
      guitar: true,
      staff: true
    },
    componentOrder: [...DEFAULT_COMPONENT_ORDER],
    leftDrawerOpen: true,
    rightDrawerOpen: true,
    focusText: 'Select a note on any linked view'
  }),

  getters: {
    noteNames: (state) => state.accidentalMode === 'flat' ? FLAT_NAMES : SHARP_NAMES,
    currentKey: (state) => keyById(state.currentKeyId),
    selectedSet: (state) => new Set(state.selectedPitchClasses),
    keyPitchClassSet() {
      return new Set(keyPitchClasses(this.currentKey))
    },
    isAllSelected: (state) => state.selectedPitchClasses.length === 12,
    hasSelection: (state) => state.selectedPitchClasses.length > 0,
    isSelected: (state) => (pitchClass) => state.selectedPitchClasses.includes(mod12(pitchClass)),
    isInCurrentKey() {
      return (pitchClass) => this.keyPitchClassSet.has(mod12(pitchClass))
    },
    noteName() {
      return (pitchClass) => this.noteNames[mod12(pitchClass)]
    },
    selectedSummary() {
      if (this.isAllSelected) return 'All pitch classes'
      return this.selectedPitchClasses.map((pc) => this.noteName(pc)).join(', ') || 'None'
    },
    keySignatureSummary() {
      return signatureLabel(this.currentKey.signature)
    },
    keyOptions: () => MAJOR_KEYS.map((key) => ({ label: `${key.label} major`, value: key.id }))
  },

  actions: {
    selectPitchClass(pitchClass) {
      const pc = mod12(pitchClass)
      if (this.selectionMode === 'single') {
        this.selectedPitchClasses = [pc]
        return
      }
      const index = this.selectedPitchClasses.indexOf(pc)
      if (index >= 0) this.selectedPitchClasses.splice(index, 1)
      else this.selectedPitchClasses.push(pc)
    },

    togglePitchClass(pitchClass) {
      this.selectPitchClass(pitchClass)
    },

    selectAll() {
      this.selectedPitchClasses = Array.from({ length: 12 }, (_, index) => index)
    },

    clearSelection() {
      this.selectedPitchClasses = []
    },

    toggleAllNone() {
      if (this.hasSelection) this.clearSelection()
      else this.selectAll()
    },

    setSelectionMode(mode) {
      if (mode !== 'single' && mode !== 'multi') return
      this.selectionMode = mode
      if (mode === 'single' && this.selectedPitchClasses.length > 1 && !this.isAllSelected) {
        this.selectedPitchClasses = [this.selectedPitchClasses[0]]
      }
    },

    setKey(keyId) {
      const key = keyById(keyId)
      this.currentKeyId = key.id
      this.accidentalMode = key.accidentalMode
      if (this.keySelectsTonic && this.selectionMode === 'single') {
        this.selectedPitchClasses = [key.tonic]
      }
    },

    setVisibleObject(name, value) {
      if (Object.hasOwn(this.visibleObjects, name)) this.visibleObjects[name] = Boolean(value)
    },

    moveComponent(sourceId, targetId) {
      if (sourceId === targetId) return
      const from = this.componentOrder.indexOf(sourceId)
      const to = this.componentOrder.indexOf(targetId)
      if (from < 0 || to < 0) return

      const next = [...this.componentOrder]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      this.componentOrder = next
    },

    moveComponentBy(id, delta) {
      const from = this.componentOrder.indexOf(id)
      const to = from + delta
      if (from < 0 || to < 0 || to >= this.componentOrder.length) return
      const next = [...this.componentOrder]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      this.componentOrder = next
    },

    resetComponentOrder() {
      this.componentOrder = [...DEFAULT_COMPONENT_ORDER]
    },

    setFocus(text) {
      this.focusText = text
    }
  }
})
