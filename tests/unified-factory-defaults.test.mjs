import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  DEFAULT_HARMONY_COLUMN_PERCENT, DEFAULT_HARMONY_ROW_RATIOS,
  DEFAULT_INSTRUMENT_SCALES, focusTileLayout, focusStackHeights,
  instrumentPanelHeight
} from '../src/music/unifiedTiling.js'

const unified = readFileSync(new URL('../src/pages/UnifiedWorkspace.vue', import.meta.url), 'utf8')
const cosmic = readFileSync(new URL('../public/cosmic-harmony.html', import.meta.url), 'utf8')
const layout = focusTileLayout(['cosmic','staff','piano','guitar'], '', 'harmony')

test('Harmony Focus factory columns and instrument scales match tuned screenshot', () => {
  assert.equal(DEFAULT_HARMONY_COLUMN_PERCENT, 58)
  assert.deepEqual(DEFAULT_HARMONY_ROW_RATIOS, { staff: 0.52, piano: 0.18, guitar: 0.30 })
  assert.deepEqual(DEFAULT_INSTRUMENT_SCALES, { piano: 100, guitar: 100 })
  assert.match(unified, /columnPercents = ref\(\{ harmony: DEFAULT_HARMONY_COLUMN_PERCENT, four: 50, staff: 50 \}\)/)
  assert.match(unified, /const layoutPreset = ref\('harmony'\)/)
})

test('at desktop screenshot dimensions staff/piano/guitar heights track 52/18/30', () => {
  const available = 758 - 12
  const heights = focusStackHeights(layout, 1700, 758, DEFAULT_HARMONY_COLUMN_PERCENT, 9, DEFAULT_INSTRUMENT_SCALES)
  assert.equal(heights.reduce((sum, n) => sum + n, 12), 758)
  for (const [index, id] of ['staff', 'piano', 'guitar'].entries()) {
    assert.ok(Math.abs(heights[index] / available - DEFAULT_HARMONY_ROW_RATIOS[id]) <= 0.025, `${id}: ${heights[index]}`)
  }
})

test('instrument scaling still frees vertical room without cropping and short windows scroll', () => {
  const full = focusStackHeights(layout, 1400, 700, 58, 9, DEFAULT_INSTRUMENT_SCALES)
  const smaller = focusStackHeights(layout, 1400, 700, 58, 9, { piano: 60, guitar: 60 })
  assert.ok(smaller[0] > full[0]); assert.ok(smaller[1] < full[1]); assert.ok(smaller[2] < full[2])
  const short = focusStackHeights(layout, 1700, 400, 58, 9, DEFAULT_INSTRUMENT_SCALES)
  const contentWidth = 1700 * 0.42 - 9
  assert.ok(short[1] >= instrumentPanelHeight('piano', contentWidth, 9, 100))
  assert.ok(short[2] >= instrumentPanelHeight('guitar', contentWidth, 9, 100))
  assert.ok(short.reduce((a, b) => a + b, 12) > 400)
})

test('Cosmic narrative has 73/27 factory split, while existing saved preference wins', () => {
  assert.match(cosmic, /const defaultFraction = 0\.27;/)
  assert.match(cosmic, /var\(--narrative-width,27%\)/)
  assert.match(cosmic, /preferredFraction = saved/)
  assert.match(cosmic, /localStorage\.setItem\(storageKey, String\(preferredFraction\)\)/)
})

test('layout restore selects updated factory defaults but persisted custom splits take precedence', () => {
  assert.match(unified, /columnPercents\.value = \{ harmony: DEFAULT_HARMONY_COLUMN_PERCENT, four: 50, staff: 50 \}/)
  assert.match(unified, /instrumentScale\.value = \{ \.\.\.DEFAULT_INSTRUMENT_SCALES \}/)
  assert.match(unified, /saved\.instrumentScale\?\.piano \?\? DEFAULT_INSTRUMENT_SCALES\.piano/)
  assert.match(unified, /saved\.instrumentScale\?\.guitar \?\? DEFAULT_INSTRUMENT_SCALES\.guitar/)
  assert.match(unified, /saved\.columnPercents\?\.\[option\.value\]/)
  assert.match(unified, /focusRowOffsets\.value = \{/ )
  assert.match(unified, /frameWindow\.dispatchEvent\(new frameWindow\.Event\('d3srt:restore-layout-defaults'\)\)/)
  assert.match(cosmic, /localStorage\.removeItem\(storageKey\)/)
})
