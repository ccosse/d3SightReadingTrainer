// The responsive workspace only controls presentation. It never changes the
// shared musical state or destroys view instances when a pane is hidden.
export const UNIFIED_PANES = [
  { id: 'cosmic', label: 'Cosmic Harmony', icon: 'orbit' },
  { id: 'staff', label: 'Staff', icon: 'music_note' },
  { id: 'piano', label: 'Piano', icon: 'piano' },
  { id: 'guitar', label: 'Guitar', icon: 'queue_music' }
]

const DEFAULT_VISIBILITY = Object.freeze({ cosmic: true, staff: true, piano: true, guitar: true })

export function restoreUnifiedLayout(value) {
  if (!value || typeof value !== 'object') return { ...DEFAULT_VISIBILITY }
  const flags = Object.fromEntries(UNIFIED_PANES.map(({ id }) => [id, value[id] !== false]))
  return Object.values(flags).some(Boolean) ? flags : { ...DEFAULT_VISIBILITY }
}

export function tileLayout(visibleIds, maximizedId = '') {
  const active = UNIFIED_PANES.map(({ id }) => id).filter((id) => visibleIds.includes(id))
  if (maximizedId && active.includes(maximizedId)) {
    return { columns: 1, rows: 1, areas: { [maximizedId]: '1 / 1 / 2 / 2' }, ids: [maximizedId] }
  }
  const areas = {}
  if (active.length === 1) areas[active[0]] = '1 / 1 / 2 / 2'
  if (active.length === 2) {
    // Two width-hungry instrument SVGs are more legible when stacked.
    const stack = active.every((id) => id === 'piano' || id === 'guitar')
    areas[active[0]] = '1 / 1 / 2 / 2'
    areas[active[1]] = stack ? '2 / 1 / 3 / 2' : '1 / 2 / 2 / 3'
    return { columns: stack ? 1 : 2, rows: stack ? 2 : 1, areas, ids: active }
  }
  if (active.length === 3) {
    areas[active[0]] = '1 / 1 / 2 / 2'
    areas[active[1]] = '1 / 2 / 2 / 3'
    areas[active[2]] = '2 / 1 / 3 / 3'
  }
  if (active.length === 4) {
    areas[active[0]] = '1 / 1 / 2 / 2'
    areas[active[1]] = '1 / 2 / 2 / 3'
    areas[active[2]] = '2 / 1 / 3 / 2'
    areas[active[3]] = '2 / 2 / 3 / 3'
  }
  return { columns: active.length > 1 ? 2 : 1, rows: active.length > 2 ? 2 : 1, areas, ids: active }
}
