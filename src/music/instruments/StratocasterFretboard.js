import { STANDARD_GUITAR_MIDI_LOW_TO_HIGH, mod12 } from '../theory'

// Legacy d3GuitarExplorer physical constants. Measurements are in inches;
// the SVG remains viewBox-scalable and all string/fret geometry derives from this model.
export const D3GE_STRATO_GEOMETRY = Object.freeze({
  width: 928,
  height: 236.93617021276594,
  wBridge: 2.5,
  wNut: 1.625,
  dy: 0.875,
  scaleLength: 25.5,
  semitoneRatio: 1.0594630943592953,
  scaleFactor: 44.42553191489362,
  nutX: 58,
  openX: 18
})

export class StratocasterFretboard {
  constructor({ fretCount = 24, woodFretCount = 22 } = {}) {
    const geometry = D3GE_STRATO_GEOMETRY
    this.width = geometry.width
    this.height = geometry.height
    this.wBridge = geometry.wBridge
    this.wNut = geometry.wNut
    this.dy = geometry.dy
    this.L0 = geometry.scaleLength
    this.k = geometry.semitoneRatio
    this.scaleFactor = geometry.scaleFactor
    this.fretCount = fretCount
    this.woodFretCount = Math.min(woodFretCount, fretCount)
    this.openX = geometry.openX
    this.nutX = geometry.nutX
    this.centerY = this.height / 2
    this.endX = this.fretX(this.fretCount)
    this.lastFretDistance = this.distanceFromNut(this.fretCount)
    this.topAtNut = this.edgeY(this.nutX, 'top')
    this.bottomAtNut = this.edgeY(this.nutX, 'bottom')
    this.topAtEnd = this.edgeY(this.endX, 'top')
    this.bottomAtEnd = this.edgeY(this.endX, 'bottom')
    this.dotFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]
    this.woodEndX = this.fretX(this.woodFretCount)
    this.frets = this.buildFrets()
    this.strings = this.buildStrings()
    this.viewBox = `0 0 ${this.width} ${this.height}`
  }

  distanceFromNut(fret) {
    return this.L0 * (1 - Math.pow(this.k, -fret))
  }

  fretX(fret) {
    return this.nutX + this.distanceFromNut(fret) * this.scaleFactor
  }

  physicalDistanceForX(x) {
    return Math.max(0, Math.min(this.L0, (x - this.nutX) / this.scaleFactor))
  }

  neckWidthAtX(x) {
    const distance = this.physicalDistanceForX(x)
    const taper = this.lastFretDistance > 0 ? distance / this.lastFretDistance : 0
    const widthInches = this.wNut + (this.wBridge - this.wNut) * taper
    return widthInches * this.scaleFactor
  }

  edgeY(x, edge) {
    const halfWidth = this.neckWidthAtX(x) / 2
    return edge === 'top' ? this.centerY - halfWidth : this.centerY + halfWidth
  }

  stringY(stringIndex, x) {
    const top = this.edgeY(x, 'top')
    const bottom = this.edgeY(x, 'bottom')
    return bottom - (stringIndex / 5) * (bottom - top)
  }

  buildFrets() {
    const frets = []
    for (let fret = 0; fret <= this.fretCount; fret += 1) {
      const x = this.fretX(fret)
      const previousX = fret === 0 ? this.openX : this.fretX(fret - 1)
      frets.push({
        number: fret,
        x,
        centerX: (previousX + x) / 2,
        top: this.edgeY(x, 'top'),
        bottom: this.edgeY(x, 'bottom'),
        beyondWood: fret > this.woodFretCount
      })
    }
    return frets
  }

  buildStrings() {
    return STANDARD_GUITAR_MIDI_LOW_TO_HIGH.map((openMidi, stringIndex) => {
      const notes = []
      for (let fret = 0; fret <= this.fretCount; fret += 1) {
        const left = fret === 0 ? this.openX : this.fretX(fret - 1)
        const right = fret === 0 ? this.nutX : this.fretX(fret)
        const x = (left + right) / 2
        notes.push({
          fret,
          midi: openMidi + fret,
          pitchClass: mod12(openMidi + fret),
          x,
          y: this.stringY(stringIndex, Math.max(this.nutX, x)),
          beyondWood: fret > this.woodFretCount
        })
      }
      return {
        index: stringIndex,
        openMidi,
        y0: this.stringY(stringIndex, this.nutX),
        y1: this.stringY(stringIndex, this.endX),
        notes
      }
    })
  }

  boardPoints() {
    return [
      [this.nutX, this.edgeY(this.nutX, 'top')],
      [this.woodEndX, this.edgeY(this.woodEndX, 'top')],
      [this.woodEndX, this.edgeY(this.woodEndX, 'bottom')],
      [this.nutX, this.edgeY(this.nutX, 'bottom')]
    ].map((point) => point.join(',')).join(' ')
  }

  extensionPoints() {
    return [
      [this.woodEndX, this.edgeY(this.woodEndX, 'top')],
      [this.endX, this.edgeY(this.endX, 'top')],
      [this.endX, this.edgeY(this.endX, 'bottom')],
      [this.woodEndX, this.edgeY(this.woodEndX, 'bottom')]
    ].map((point) => point.join(',')).join(' ')
  }

  dotPositions(fret) {
    const current = this.frets[fret]
    if (!current) return []
    const x = current.centerX
    const top = this.edgeY(x, 'top')
    const bottom = this.edgeY(x, 'bottom')
    const middle = (top + bottom) / 2
    const offset = (bottom - top) * 0.22
    if (fret === 12 || fret === 24) return [{ x, y: middle - offset }, { x, y: middle + offset }]
    return [{ x, y: middle }]
  }
}
