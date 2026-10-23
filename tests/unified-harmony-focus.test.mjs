import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  focusTileLayout, focusStackHeights, tileLayout,
  UNIFIED_LAYOUT_PRESETS, DEFAULT_INSTRUMENT_SCALES
} from '../src/music/unifiedTiling.js'

const ids = ['cosmic','staff','piano','guitar']
const component = readFileSync(new URL('../src/pages/UnifiedWorkspace.vue', import.meta.url), 'utf8')

test('Harmony Focus fills the left column and stacks staff/piano/guitar on the right', () => {
  const layout = focusTileLayout(ids, '', 'harmony')
  assert.equal(layout.focusStack, true)
  assert.equal(layout.areas.cosmic, '1 / 1 / 4 / 2')
  assert.equal(layout.areas.staff, '1 / 2 / 2 / 3')
  assert.equal(layout.areas.piano, '2 / 2 / 3 / 3')
  assert.equal(layout.areas.guitar, '3 / 2 / 4 / 3')
  assert.deepEqual(layout.rightIds, ['staff','piano','guitar'])
})
test('Staff Focus works with visible subset; maximization and hidden focus fall back safely', () => {
  const layout = focusTileLayout(ids, '', 'staff')
  assert.equal(layout.areas.staff, '1 / 1 / 4 / 2')
  assert.deepEqual(layout.rightIds, ['cosmic','piano','guitar'])
  const noGuitar = focusTileLayout(['cosmic','staff','piano'], '', 'harmony')
  assert.equal(noGuitar.areas.cosmic, '1 / 1 / 3 / 2')
  assert.equal(noGuitar.areas.piano, '2 / 2 / 3 / 3')
  assert.deepEqual(focusTileLayout(ids, 'piano', 'harmony'), tileLayout(ids, 'piano'))
  assert.deepEqual(focusTileLayout(['staff','piano'], '', 'harmony'), tileLayout(['staff','piano']))
})
test('Four Panes mode is unchanged; three selectable named presets exist', () => {
  assert.deepEqual(focusTileLayout(ids, '', 'four'), tileLayout(ids))
  assert.deepEqual(UNIFIED_LAYOUT_PRESETS.map(x => x.value), ['harmony','four','staff'])
})
test('right-hand pane sizes honor instrument scaling and fill viewport, with overflow when necessary', () => {
  const layout = focusTileLayout(ids, '', 'harmony')
  const sizes = focusStackHeights(layout, 1640, 680, 50, 8, DEFAULT_INSTRUMENT_SCALES)
  assert.equal(sizes.length, 3)
  assert.ok(sizes[0] >= 220 && sizes[1] >= 90 && sizes[2] >= 90)
  assert.ok(Math.abs(sizes.reduce((a,b) => a+b) + 12 - 680) <= 2)
  const compact = focusStackHeights(layout, 1640, 680, 50, 8, { piano:50, guitar:50 })
  assert.ok(compact[0] > sizes[0])
  assert.ok(compact[1] < sizes[1] && compact[2] < sizes[2])
  const tall = focusStackHeights(layout, 1640, 420, 50, 8, { piano:100, guitar:100 })
  assert.ok(tall.reduce((a,b)=>a+b) + 12 >= 420, 'short screens scroll instead of squashing instruments')
})
test('drag offsets change adjacent rows but leave total height and instrument SVG scales alone', () => {
  const layout = focusTileLayout(ids, '', 'harmony')
  const base = focusStackHeights(layout, 1400, 680, 50, 8, DEFAULT_INSTRUMENT_SCALES)
  const moved = focusStackHeights(layout, 1400, 680, 50, 8, DEFAULT_INSTRUMENT_SCALES, [-20,0])
  assert.equal(moved[0], base[0]-20)
  assert.equal(moved[1], base[1]+20)
  assert.equal(moved[2], base[2])
  const extreme = focusStackHeights(layout, 1400, 680, 50, 8, DEFAULT_INSTRUMENT_SCALES, [99999,99999])
  assert.ok(extreme.every(height => height >= 90))
})
test('UI keeps the original instruments and persistable, accessible drag layout', () => {
  assert.match(component, /<PianoKeyboard\s*\/>/)
  assert.match(component, /<StratocasterFretboard\s*\/>/)
  assert.match(component, /focusTileLayout\(visibleIds\.value, maximized\.value, layoutPreset\.value\)/)
  assert.match(component, /beginFocusRowResize\(\$event, index\)/)
  assert.match(component, /beginSplit\(\$event, 'column'\)/)
  assert.match(component, /focusRowOffsets: focusRowOffsets\.value/)
  assert.match(component, /instrumentScale: instrumentScale\.value/)
  assert.match(component, /layoutPreset: layoutPreset\.value/)
  assert.match(component, /instrumentScale\.piano/)
  assert.match(component, /instrumentScale\.guitar/)
  assert.match(component, /unified-layout-menu/)
})
