import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { keyById, keyPitchClasses } from '../src/music/theory.js'

const unified = readFileSync(new URL('../src/pages/UnifiedWorkspace.vue', import.meta.url), 'utf8')
const layout = readFileSync(new URL('../src/layouts/MainLayout.vue', import.meta.url), 'utf8')
const store = readFileSync(new URL('../src/stores/noteMap.js', import.meta.url), 'utf8')
const bridge = readFileSync(new URL('../src/components/CosmicMidiBridge.vue', import.meta.url), 'utf8')

test('sidebar mid-edge tabs remain mounted in open and closed states and rotate', () => {
  assert.match(unified, /class="unified-reveal unified-reveal--left"[^>]*:class="\{ 'is-open': leftOpen \}"/)
  assert.match(unified, /class="unified-reveal unified-reveal--right"[^>]*:class="\{ 'is-open': rightOpen \}"/)
  assert.doesNotMatch(unified, /v-if="!leftOpen" class="unified-reveal/
  )
  assert.doesNotMatch(unified, /v-if="!rightOpen" class="unified-reveal/
  )
  assert.match(unified, /\.unified-reveal\.is-open :deep\(\.q-icon\) \{ transform:rotate\(180deg\); \}/)
  assert.match(unified, /\.unified-reveal \{[^}]*height:82px;/)
  assert.match(unified, /icon="chevron_right" aria-label="Collapse Circle of Fifths"/)
  assert.match(unified, /icon="menu" aria-label="Toggle Circle of Fifths sidebar"/)
})

test('unified transport uses metronome icon, compact BPM and has no Classic launches', () => {
  assert.match(unified, /class="unified-metronome"/)
  assert.match(unified, /<svg width="21" height="21" viewBox="0 0 24 24"/)
  assert.match(unified, /store\.srtMetronomeOn = !store\.srtMetronomeOn/)
  assert.match(unified, /class="unified-tempo-label">BPM<\/span>/)
  assert.match(unified, /border:1px solid #666/)
  assert.doesNotMatch(unified, /label="Classic"/)
  assert.doesNotMatch(layout, /label="Classic workspace"|label="Unified workspace"/)
})

test('note selection starts clear; keyboard and guitar share deliberate scale toggle', () => {
  assert.match(store, /selectedPitchClasses: \[\]/)
  assert.match(store, /keySelectsTonic: false/)
  assert.match(store, /staffZoom: \(1120 \/ 126\) \/ \(5 \* 4\)/)
  assert.match(store, /toggleCurrentKeyNotes\(\)/)
  assert.match(store, /this\.selectedPitchClasses = \[\.\.\.this\.keyPitchClassSet\]/)
  assert.match(unified, /pane\.id === 'piano' \|\| pane\.id === 'guitar'/)
  assert.match(unified, /store\.toggleCurrentKeyNotes\(\)/)
  assert.match(unified, /<TheoryControls :show-tonic-selector="false" \/>/)
})

test('current-key note group handles major, relative minor and minor blues scale', () => {
  assert.deepEqual(keyPitchClasses(keyById('C'), 'major'), [0, 2, 4, 5, 7, 9, 11])
  assert.deepEqual(keyPitchClasses(keyById('Bb'), 'minor'), [7, 9, 10, 0, 2, 3, 5]) // G minor
  assert.deepEqual(keyPitchClasses(keyById('C'), 'blues'), [0, 3, 5, 6, 7, 10])
  assert.deepEqual(keyPitchClasses(keyById('F'), 'blues'), [5, 8, 10, 11, 0, 3])
  assert.match(bridge, /\['major', 'minor', 'blues'\]\.includes\(data\.mode\)/)
})
