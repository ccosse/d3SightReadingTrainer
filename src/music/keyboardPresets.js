export const KEYBOARD_PRESETS = [
  {
    id: '88',
    label: '88 keys · A0–C8',
    shortLabel: '88',
    startMidi: 21,
    endMidi: 108,
    whiteWidth: 32,
    whiteHeight: 170
  },
  {
    id: '76',
    label: '76 keys · E1–G7',
    shortLabel: '76',
    startMidi: 28,
    endMidi: 103,
    whiteWidth: 34,
    whiteHeight: 170
  },
  {
    id: '73',
    label: '73 keys · E1–E7',
    shortLabel: '73',
    startMidi: 28,
    endMidi: 100,
    whiteWidth: 36,
    whiteHeight: 170
  },
  {
    id: 'reface-37',
    label: 'Reface CP · 37 keys · E2–E5',
    shortLabel: '37',
    startMidi: 40,
    endMidi: 76,
    whiteWidth: 52,
    whiteHeight: 170
  }
]

export function keyboardPresetById(id) {
  return KEYBOARD_PRESETS.find((preset) => preset.id === id) || KEYBOARD_PRESETS[0]
}
