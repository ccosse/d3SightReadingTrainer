import test from 'node:test'
import assert from 'node:assert/strict'
import { tileLayout, restoreUnifiedLayout, suggestedRowPercent } from '../src/music/unifiedTiling.js'
const all = ['cosmic', 'staff', 'piano', 'guitar']
test('restored four panes place cosmic/staff above full-width stacked piano/guitar', () => {
  const layout = tileLayout(all)
  assert.deepEqual([layout.columns, layout.rows], [2, 3])
  assert.equal(layout.stackedInstruments, true)
  assert.equal(layout.areas.cosmic, '1 / 1 / 2 / 2')
  assert.equal(layout.areas.staff, '1 / 2 / 2 / 3')
  assert.equal(layout.areas.piano, '2 / 1 / 3 / 3')
  assert.equal(layout.areas.guitar, '3 / 1 / 4 / 3')
  assert.deepEqual(layout.lowerIds, ['piano', 'guitar'])
  assert.equal(suggestedRowPercent(layout, 1200, 800), 56)
})
test('hiding guitar stretches piano across the entire bottom row', () => {
  const layout = tileLayout(all.filter(id => id !== 'guitar'))
  assert.equal(layout.areas.piano, '2 / 1 / 3 / 3')
  assert.equal(layout.ids.includes('guitar'), false)
})
test('piano and guitar alone are stacked for width', () => {
  assert.deepEqual([tileLayout(['piano', 'guitar']).columns, tileLayout(['piano','guitar']).rows], [1, 2])
})
test('one pane is full screen, maximize preserves visibility state', () => {
  const layout = tileLayout(all, 'staff')
  assert.deepEqual(layout.ids, ['staff'])
  assert.equal(layout.areas.staff, '1 / 1 / 2 / 2')
})
test('invalid stored layout recovers visible panes', () => {
  const layout = restoreUnifiedLayout(Object.fromEntries(all.map(id=>[id,false])))
  assert.ok(all.every(id=>layout[id]))
})

test('with one tall view and two instruments, tall view spans the upper row', () => {
  const layout = tileLayout(['cosmic', 'piano', 'guitar'])
  assert.equal(layout.areas.cosmic, '1 / 1 / 2 / 3')
  assert.deepEqual(layout.lowerIds, ['piano', 'guitar'])
  assert.equal(layout.areas.piano, '2 / 1 / 3 / 2')
  assert.equal(layout.areas.guitar, '2 / 2 / 3 / 3')
})
test('a tall view and a width-hungry instrument stack instead of letterboxing side-by-side', () => {
  const layout = tileLayout(['staff', 'piano'])
  assert.deepEqual([layout.columns, layout.rows], [1, 2])
  assert.deepEqual(layout.lowerIds, ['piano'])
  const onlyExpansive = tileLayout(['staff', 'cosmic'])
  assert.deepEqual([onlyExpansive.columns, onlyExpansive.rows], [2, 1])
})
test('content-aware lower row gives more room to full-width guitar than piano', () => {
  const guitar = tileLayout(['cosmic', 'staff', 'guitar'])
  const piano = tileLayout(['cosmic', 'staff', 'piano'])
  const rowGuitar = suggestedRowPercent(guitar, 1250, 750, 8)
  const rowPiano = suggestedRowPercent(piano, 1250, 750, 8)
  assert.ok(rowGuitar < rowPiano, `guitar ${rowGuitar} should leave a taller bottom row than piano ${rowPiano}`)
  assert.ok(rowGuitar >= 24 && rowPiano <= 80)
})
test('keyboard geometry and viewport size influence preferred splitter height', () => {
  const layout = tileLayout(['cosmic', 'staff', 'piano'])
  assert.ok(suggestedRowPercent(layout, 1200, 850, 5) < suggestedRowPercent(layout, 1200, 850, 12))
  assert.equal(suggestedRowPercent(layout, 0, 100), 60)
})
