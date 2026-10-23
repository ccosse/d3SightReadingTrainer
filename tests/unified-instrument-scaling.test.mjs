import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEFAULT_INSTRUMENT_SCALES,
  clampInstrumentScale,
  instrumentPanelHeight
} from '../src/music/unifiedTiling.js'

const unified = readFileSync(new URL('../src/pages/UnifiedWorkspace.vue', import.meta.url), 'utf8')

test('independent, bounded default instrument scales preserve space for the Cosmic map', () => {
  assert.ok(DEFAULT_INSTRUMENT_SCALES.piano < 100)
  assert.ok(DEFAULT_INSTRUMENT_SCALES.guitar < 100)
  assert.equal(clampInstrumentScale(250), 100)
  assert.equal(clampInstrumentScale(12), 50)
  assert.equal(clampInstrumentScale(78), 80)
})
test('instrument row height follows rendered width/scale without changing SVG geometry', () => {
  const width = 1600
  for (const id of ['piano', 'guitar']) {
    const small = instrumentPanelHeight(id, width, 8, 50)
    const defaultSize = instrumentPanelHeight(id, width, 8, DEFAULT_INSTRUMENT_SCALES[id])
    const full = instrumentPanelHeight(id, width, 8, 100)
    assert.ok(small < defaultSize && defaultSize < full, `${id}: ${small}, ${defaultSize}, ${full}`)
  }
  assert.ok(instrumentPanelHeight('guitar', width, 8, 65) < 320)
  assert.ok(instrumentPanelHeight('piano', width, 8, 75) < 200)
})
test('piano and guitar have distinct menu sliders, persisted settings and constrained canvas widths', () => {
  assert.match(unified, /pane\.id === 'piano' \|\| pane\.id === 'guitar'.*icon="more_horiz"/s)
  assert.match(unified, /<q-slider :model-value="instrumentScale\[pane\.id\]"/)
  assert.match(unified, /width: `\$\{instrumentScale\.piano\}%`/)
  assert.match(unified, /width: `\$\{instrumentScale\.guitar\}%`/)
  assert.match(unified, /instrumentScale: instrumentScale\.value/)
  assert.match(unified, /instrumentPanelHeight\(id, width, keyboardRatio\.value, instrumentScale\.value\[id\]\)/)
  assert.match(unified, /unified-tiles--scalable-instruments/)
  assert.doesNotMatch(unified, /stackedHeights/)
})
