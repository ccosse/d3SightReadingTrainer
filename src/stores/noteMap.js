import { defineStore } from 'pinia'

const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']

export const useNoteMapStore = defineStore('noteMap', {
  state: () => ({
    selectedPitchClasses: [0, 3, 7, 10, 2, 5], // C, Eb, G, Bb, D, F
    accidentalMode: 'flat',
    visibleObjects: ['piano', 'guitar', 'staff']
  }),

  getters: {
    noteNames: (state) => state.accidentalMode === 'sharp' ? SHARP_NAMES : FLAT_NAMES,
    selectedSet: (state) => new Set(state.selectedPitchClasses),
    isSelected: (state) => (pitchClass) => state.selectedPitchClasses.includes(((pitchClass % 12) + 12) % 12),
    noteName() {
      return (pitchClass) => this.noteNames[((pitchClass % 12) + 12) % 12]
    }
  },

  actions: {
    togglePitchClass(pitchClass) {
      const pc = ((pitchClass % 12) + 12) % 12
      const index = this.selectedPitchClasses.indexOf(pc)
      if (index >= 0) this.selectedPitchClasses.splice(index, 1)
      else this.selectedPitchClasses.push(pc)
    },

    clearSelection() {
      this.selectedPitchClasses = []
    },

    selectPitchClasses(values) {
      this.selectedPitchClasses = [...new Set(values.map(v => ((v % 12) + 12) % 12))]
    },

    setAccidentalMode(mode) {
      if (mode === 'flat' || mode === 'sharp') this.accidentalMode = mode
    }
  }
})
