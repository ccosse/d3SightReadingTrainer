import test from 'node:test'
import assert from 'node:assert/strict'
import { reconcileMusicalSteps } from '../src/music/musicalSession.js'

test('initial Sun + free path gets unique identity for each occurrence', () => {
  const { steps, nextId } = reconcileMusicalSteps([], [
    { nodeId: 'sun' }, { nodeId: 'IV' }, { nodeId: 'sun' }, { nodeId: 'IV' }
  ])
  assert.deepEqual(steps.map(x => x.nodeId), ['sun', 'IV', 'sun', 'IV'])
  assert.equal(new Set(steps.map(x => x.stepId)).size, 4)
  assert.equal(nextId, 5)
})

test('adding a path step preserves existing step identities', () => {
  const first = reconcileMusicalSteps([], [{ nodeId:'sun' }, { nodeId:'ii' }])
  const second = reconcileMusicalSteps(first.steps, [{ nodeId:'sun' }, { nodeId:'ii' }, { nodeId:'V' }], first.nextId)
  assert.deepEqual(second.steps.slice(0,2).map(x => x.stepId), first.steps.map(x => x.stepId))
  assert.notEqual(second.steps[2].stepId, first.steps[1].stepId)
})

test('removing an interior visit preserves surrounding visits', () => {
  const a = reconcileMusicalSteps([], [{ nodeId:'sun' }, { nodeId:'ii' }, { nodeId:'V' }, { nodeId:'sun' }])
  const b = reconcileMusicalSteps(a.steps, [{ nodeId:'sun' }, { nodeId:'V' }, { nodeId:'sun' }], a.nextId)
  assert.deepEqual(b.steps.map(x => x.stepId), [a.steps[0].stepId, a.steps[2].stepId, a.steps[3].stepId])
})

test('reject bad node IDs and discard malformed MIDI pitch', () => {
  assert.throws(() => reconcileMusicalSteps([], [{}]), /Missing Cosmic node/)
  const a = reconcileMusicalSteps([], [{ nodeId:'sun', notes:[{ midi:60 }, {midi:200}, {midi:61.5}] }])
  assert.deepEqual(a.steps[0].notes, [{ midi:60, velocity:85, channel:0 }])
})
