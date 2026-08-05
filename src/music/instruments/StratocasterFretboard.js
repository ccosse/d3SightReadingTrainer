import { STANDARD_GUITAR_MIDI_LOW_TO_HIGH, mod12 } from '../theory'

export class StratocasterFretboard {
  constructor({ width = 1180, height = 280, fretCount = 24, woodFretCount = 22 } = {}) {
    this.width = width
    this.height = height
    this.fretCount = fretCount
    this.woodFretCount = Math.min(woodFretCount, fretCount)
    this.openX = 20
    this.nutX = 84
    this.endX = width - 28
    this.topAtNut = 69
    this.bottomAtNut = height - 69
    this.topAtEnd = 31
    this.bottomAtEnd = height - 31
    this.dotFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]
    this.scaleLength = (this.endX - this.nutX) / (1 - Math.pow(2, -fretCount / 12))
    this.woodEndX = this.fretX(this.woodFretCount)
    this.frets = this.buildFrets()
    this.strings = this.buildStrings()
    this.viewBox = `0 0 ${width} ${height}`
  }

  fretX(fret) {
    if (fret === 0) return this.nutX
    return this.nutX + this.scaleLength * (1 - Math.pow(2, -fret / 12))
  }

  edgeY(x, edge) {
    const t = Math.max(0, Math.min(1, (x - this.nutX) / (this.endX - this.nutX)))
    if (edge === 'top') return this.topAtNut + (this.topAtEnd - this.topAtNut) * t
    return this.bottomAtNut + (this.bottomAtEnd - this.bottomAtNut) * t
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
      [this.nutX, this.topAtNut],
      [this.woodEndX, this.edgeY(this.woodEndX, 'top')],
      [this.woodEndX, this.edgeY(this.woodEndX, 'bottom')],
      [this.nutX, this.bottomAtNut]
    ].map((point) => point.join(',')).join(' ')
  }

  extensionPoints() {
    return [
      [this.woodEndX, this.edgeY(this.woodEndX, 'top')],
      [this.endX, this.topAtEnd],
      [this.endX, this.bottomAtEnd],
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
    if (fret === 12 || fret === 24) return [{ x, y: middle - 25 }, { x, y: middle + 25 }]
    return [{ x, y: middle }]
  }
}
