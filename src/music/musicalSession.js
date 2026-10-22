// Shared musical-session data model. Pure JS; used by the Pinia state adapter.
// A step represents a particular VISIT to a Cosmic node, not the node itself.
export function reconcileMusicalSteps(previous = [], incoming = [], nextId = 1) {
  const old = Array.isArray(previous) ? previous : []
  const input = Array.isArray(incoming) ? incoming : []
  const nodeOf = (step) => String(step?.nodeId || step?.id || '')
  let prefix = 0
  while (prefix < Math.min(old.length, input.length) && nodeOf(old[prefix]) === nodeOf(input[prefix])) prefix++
  let suffix = 0
  while (suffix < Math.min(old.length, input.length) - prefix &&
    nodeOf(old[old.length - suffix - 1]) === nodeOf(input[input.length - suffix - 1])) suffix++
  const steps = input.map((source, index) => {
    const nodeId = nodeOf(source)
    if (!nodeId) throw new Error(`Missing Cosmic node at step ${index}`)
    const carried = index < prefix ? old[index] : (index >= input.length - suffix ? old[old.length - (input.length - index)] : null)
    const stepId = carried?.stepId || `step-${nextId++}`
    return { stepId, nodeId, name: String(source.name || nodeId),
      notes: Array.isArray(source.notes) ? source.notes.filter((note) => Number.isInteger(note?.midi) && note.midi >= 0 && note.midi <= 127).map((note) => ({ midi: note.midi, velocity: note.velocity ?? 85, channel: note.channel ?? 0 })) : [] }
  })
  return { steps, nextId }
}


// A musical focus is an inspection/selection snapshot, separate from sounding
// MIDI voices. It is safe to retain while transport is paused.
export function normalizeMusicalFocus({ midis = [], pitchClasses = [], source = 'unknown', stepId = null } = {}) {
  const pitches = [...new Set((Array.isArray(midis) ? midis : []).filter((n) => Number.isInteger(n) && n >= 0 && n <= 127))]
  const pcs = [...new Set([
    ...(Array.isArray(pitchClasses) ? pitchClasses : []).filter((n) => Number.isInteger(n) && n >= 0 && n <= 11),
    ...pitches.map((n) => n % 12)
  ])]
  return {
    source: String(source || 'unknown'),
    stepId: typeof stepId === 'string' && stepId ? stepId : null,
    midis: pitches,
    pitchClasses: pcs
  }
}
