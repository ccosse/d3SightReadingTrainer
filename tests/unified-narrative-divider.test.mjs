import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const cosmic = readFileSync(new URL('../public/cosmic-harmony.html', import.meta.url), 'utf8')

test('Cosmic narrative divider is inside the Cosmic iframe layout, not the staff workspace', () => {
  assert.match(cosmic, /<\/section><div id="cosmicNarrativeDivider"[^>]*role="separator"[^>]*><\/div><aside class="panel side">/)
  assert.match(cosmic, /html\.embedded\.embed-narrative \.layout \{[^}]*grid-template-columns:minmax\(0,1fr\) 10px minmax\(/)
  assert.match(cosmic, /#cosmicNarrativeDivider \{ display:none; \}/)
  assert.match(cosmic, /html\.embedded\.embed-narrative #cosmicNarrativeDivider \{[^}]*cursor:col-resize/)
})

test('narrative split tracks pointer, respects widths, persists, and supports keyboard', () => {
  assert.match(cosmic, /d3srtCosmicNarrativeDividerV1/)
  assert.match(cosmic, /divider\.setPointerCapture\(event\.pointerId\)/)
  assert.match(cosmic, /divider\.addEventListener\('pointermove'/)
  assert.match(cosmic, /available - mapMin/)
  assert.match(cosmic, /localStorage\.setItem\(storageKey, String\(preferredFraction\)\)/)
  assert.match(cosmic, /event\.key === 'ArrowLeft'/)
  assert.match(cosmic, /event\.key === 'ArrowRight'/)
  assert.match(cosmic, /new ResizeObserver\(refreshWidth\)\.observe\(layout\)/)
})

test('one scrolling narrative and sticky Back/Reset/Staff row are retained', () => {
  assert.match(cosmic, /html\.embedded\.embed-narrative \.side \{[^}]*overflow-y:auto/)
  assert.match(cosmic, /html\.embedded\.embed-narrative \.side > #pathNarrative \{[^}]*overflow:visible/)
  assert.match(cosmic, /html\.embedded\.embed-narrative \.side > #narrativeActionBar \{[^}]*position:sticky/)
})
