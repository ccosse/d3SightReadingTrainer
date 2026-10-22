import test from 'node:test'
import assert from 'node:assert/strict'
import { tileLayout, restoreUnifiedLayout } from '../src/music/unifiedTiling.js'
const all = ['cosmic', 'staff', 'piano', 'guitar']
test('four panes use a 2 by 2 layout', () => {
  const layout = tileLayout(all)
  assert.deepEqual([layout.columns, layout.rows], [2, 2])
  assert.equal(layout.areas.guitar, '2 / 2 / 3 / 3')
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
