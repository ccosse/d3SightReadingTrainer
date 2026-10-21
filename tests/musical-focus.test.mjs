import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeMusicalFocus, reconcileMusicalSteps } from '../src/music/musicalSession.js'

test('harmonic focus normalizes valid MIDI pitches and deduplicates pitch classes', () => {
  const focus = normalizeMusicalFocus({ midis: [60, 64, 67, 72, 60, -1, 128, '60'], pitchClasses: [7, 11, 999], source: 'cosmic', stepId: 'step-2' })
  assert.deepEqual(focus, { source: 'cosmic', stepId: 'step-2', midis: [60, 64, 67, 72], pitchClasses: [7, 11, 0, 4], })
})

test('manual key selections keep pitch classes without inventing MIDI octaves', () => {
  const focus = normalizeMusicalFocus({ pitchClasses: [0, 4, 7], source: 'piano' })
  assert.deepEqual(focus.midis, [])
  assert.deepEqual(focus.pitchClasses, [0, 4, 7])
})

test('distinct visits to repeated Cosmic node preserve stable step identifiers during edits', () => {
  const start = reconcileMusicalSteps([], [{nodeId:'sun',notes:[]},{nodeId:'V',notes:[{midi:67}]},{nodeId:'sun',notes:[{midi:60}]}], 1)
  assert.equal(new Set(start.steps.map(s => s.stepId)).size, 3)
  const next = reconcileMusicalSteps(start.steps, [{nodeId:'sun'},{nodeId:'ii'},{nodeId:'V'},{nodeId:'sun'}], start.nextId)
  assert.equal(next.steps[0].stepId, start.steps[0].stepId)
  assert.equal(next.steps[3].stepId, start.steps[2].stepId)
  assert.equal(next.steps[2].stepId, start.steps[1].stepId)
  assert.notEqual(next.steps[1].stepId, start.steps[1].stepId)
})
