import { NATURAL_PITCH_CLASSES, mod12 } from '../theory'

export class PianoKeyboard {
  constructor({ startMidi = 48, endMidi = 83, whiteWidth = 52, whiteHeight = 170 } = {}) {
    this.startMidi = startMidi
    this.endMidi = endMidi
    this.whiteWidth = whiteWidth
    this.whiteHeight = whiteHeight
    this.blackWidth = Math.round(whiteWidth * 0.62)
    this.blackHeight = Math.round(whiteHeight * 0.64)
    this.keys = this.buildKeys()
    this.whiteKeys = this.keys.filter((key) => !key.black)
    this.blackKeys = this.keys.filter((key) => key.black)
    this.width = this.whiteKeys.length * this.whiteWidth
    this.height = this.whiteHeight + 24
    this.viewBox = `0 0 ${this.width} ${this.height}`
  }

  buildKeys() {
    const keys = []
    let whiteIndex = 0

    for (let midi = this.startMidi; midi <= this.endMidi; midi += 1) {
      const pitchClass = mod12(midi)
      const black = !NATURAL_PITCH_CLASSES.has(pitchClass)

      if (!black) {
        keys.push({
          midi,
          pitchClass,
          black: false,
          x: whiteIndex * this.whiteWidth,
          y: 0,
          width: this.whiteWidth,
          height: this.whiteHeight
        })
        whiteIndex += 1
      } else {
        keys.push({
          midi,
          pitchClass,
          black: true,
          x: whiteIndex * this.whiteWidth - this.blackWidth / 2,
          y: 0,
          width: this.blackWidth,
          height: this.blackHeight
        })
      }
    }

    return keys
  }
}
