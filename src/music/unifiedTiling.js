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
    // A Cosmic map and a staff are comfortable side-by-side. Every other
    // combination containing a wide instrument benefits from stacking.
    const stack = active.some((id) => id === 'piano' || id === 'guitar')
    areas[active[0]] = '1 / 1 / 2 / 2'
    areas[active[1]] = stack ? '2 / 1 / 3 / 2' : '1 / 2 / 2 / 3'
    return { columns: stack ? 1 : 2, rows: stack ? 2 : 1, areas, ids: active, upperIds: stack ? [active[0]] : active, lowerIds: stack ? [active[1]] : [] }
  }
  if (active.length === 3) {
    const expansive = active.filter((id) => id === 'cosmic' || id === 'staff')
    if (expansive.length === 1) {
      // When CH or Staff is the only tall view, let it span the full upper row.
      // Keyboard/fretboard take the wide but shallow lower row.
      const instruments = active.filter((id) => id !== expansive[0])
      areas[expansive[0]] = '1 / 1 / 2 / 3'
      areas[instruments[0]] = '2 / 1 / 3 / 2'
      areas[instruments[1]] = '2 / 2 / 3 / 3'
    } else {
      areas[active[0]] = '1 / 1 / 2 / 2'
      areas[active[1]] = '1 / 2 / 2 / 3'
      areas[active[2]] = '2 / 1 / 3 / 3'
    }
  }
  if (active.length === 4) {
    // Two complementary tall panes above two full-width, stacked instruments.
    // Playing piano and guitar side-by-side makes both too narrow.
    areas.cosmic = '1 / 1 / 2 / 2'
    areas.staff = '1 / 2 / 2 / 3'
    areas.piano = '2 / 1 / 3 / 3'
    areas.guitar = '3 / 1 / 4 / 3'
    return { columns: 2, rows: 3, areas, ids: active,
      upperIds: ['cosmic', 'staff'], lowerIds: ['piano', 'guitar'], stackedInstruments: true }
  }
  const upperIds = active.filter((id) => areas[id]?.startsWith('1 /'))
  const lowerIds = active.filter((id) => areas[id]?.startsWith('2 /'))
  return { columns: active.length > 1 ? 2 : 1, rows: active.length > 2 ? 2 : 1, areas, ids: active, upperIds, lowerIds }
}

// The focus presets share the same four mounted panes and existing state.
// A focused map or staff occupies the full left column; the other visible
// panes stack in the right column, regardless of which instruments are shown.
export const UNIFIED_LAYOUT_PRESETS = Object.freeze([
  { value: 'harmony', label: 'Harmony Focus' },
  { value: 'four', label: 'Four Panes' },
  { value: 'staff', label: 'Staff Focus' }
])

export function focusTileLayout(visibleIds, maximizedId = '', preset = 'harmony') {
  const focusedId = preset === 'staff' ? 'staff' : 'cosmic'
  const original = tileLayout(visibleIds, maximizedId)
  if (preset === 'four' || maximizedId || !original.ids.includes(focusedId) || original.ids.length < 2) return original
  const rightIds = original.ids.filter(id => id !== focusedId)
  const rows = rightIds.length
  const areas = { [focusedId]: `1 / 1 / ${rows + 1} / 2` }
  rightIds.forEach((id, index) => { areas[id] = `${index + 1} / 2 / ${index + 2} / 3` })
  return { columns: 2, rows, areas, ids: original.ids, focusStack: true,
    focusedId, rightIds, upperIds: [focusedId, rightIds[0]], lowerIds: rightIds.slice(1) }
}

// Right-hand instrument rows follow their *scaled* canvas widths. A staff/map
// row takes the remaining vertical space; the layout can scroll when needed.
export function focusStackHeights(layout, width, height, columnPercent, keyboardRatio, scales, offsets = []) {
  if (!layout.focusStack) return []
  const paneWidth = Math.max(0, width * (1 - columnPercent / 100) - 9)
  const ids = layout.rightIds
  const gap = 6
  const minHeight = id => id === 'piano' || id === 'guitar' ? 90 : 220
  const base = ids.map(id => id === 'piano' || id === 'guitar'
    ? Math.max(minHeight(id), instrumentPanelHeight(id, paneWidth, keyboardRatio, scales[id]))
    : minHeight(id))
  const remaining = height - base.reduce((a, b) => a + b, 0) - gap * (ids.length - 1)
  if (remaining > 0) {
    const tallIndex = ids.findIndex(id => id === 'staff' || id === 'cosmic')
    base[tallIndex >= 0 ? tallIndex : 0] += remaining
  }
  const adjusted = [...base]
  offsets.slice(0, ids.length - 1).forEach((offset, i) => {
    const delta = Math.max(minHeight(ids[i]) - adjusted[i],
      Math.min(adjusted[i + 1] - minHeight(ids[i + 1]), Number(offset) || 0))
    adjusted[i] += delta
    adjusted[i + 1] -= delta
  })
  return adjusted.map(n => Math.round(n))
}

/**
 * Initial splitter position using the natural shape of the lower views.
 * Height is capped by the space actually available, and dragging the splitter
 * always overrides this suggestion. No SVG or instrument geometry is changed.
 * keyboardRatio is the current keyboard SVG's natural width/height ratio.
 */
export function suggestedRowPercent(layout, width, height, keyboardRatio = 8) {
  // Full-width instruments are independently sized below the upper pair.
  if (layout.rows === 3) return 56
  if (layout.rows !== 2 || !(width > 0) || !(height > 0)) return 60
  const lower = layout.lowerIds || []
  if (!lower.length) return 60
  const lowerTwo = lower.length === 2
  const contentWidth = lowerTwo ? Math.max(1, (width - 6) / 2) : width
  const wanted = lower.map((id) => {
    if (id === 'piano') return contentWidth / Math.max(3, keyboardRatio) + 44
    if (id === 'guitar') return contentWidth * (237 / 928) + 44
    if (id === 'staff') return contentWidth * (380 / 1120) + 150
    return contentWidth * (775 / 860) + 45
  })
  // We cannot give the lower row all the space on a short laptop screen.
  const lowerHeight = Math.min(height * 0.60, Math.max(115, ...wanted) + 10)
  return Math.max(24, Math.min(80, Math.round(100 * (1 - lowerHeight / height))))
}

// Size percentages are intentionally conservative so the notation and Cosmic
// panes retain vertical space on laptop displays. Both are user-adjustable.
export const DEFAULT_INSTRUMENT_SCALES = Object.freeze({ piano: 75, guitar: 65 })

export function clampInstrumentScale(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 75
  return Math.max(50, Math.min(100, Math.round(numeric / 5) * 5))
}

// Return the tile's required height including its 31px header and breathing
// room; match the SVG viewBox so resizing changes row height without cropping.
export function instrumentPanelHeight(id, paneWidth, keyboardRatio = 8, scale = 100) {
  if (id !== 'piano' && id !== 'guitar') return 0
  const drawnWidth = Math.max(0, paneWidth - 12) * clampInstrumentScale(scale) / 100
  const ratio = id === 'piano' ? 1 / Math.max(3, keyboardRatio) : 236.93617021276594 / 928
  return Math.ceil(drawnWidth * ratio + 44)
}
