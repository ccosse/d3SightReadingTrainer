import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const reader = readFileSync(new URL('../src/components/ScrollingSightReader.vue', import.meta.url), 'utf8')
const unified = readFileSync(new URL('../src/pages/UnifiedWorkspace.vue', import.meta.url), 'utf8')
const store = readFileSync(new URL('../src/stores/noteMap.js', import.meta.url), 'utf8')
const cosmic = readFileSync(new URL('../public/cosmic-harmony.html', import.meta.url), 'utf8')

test('Unified invokes the same recording-aware staff transport as Classic', () => {
  assert.match(reader, /srtTransportCommand === 'play'[^\n]+transportPlay\(\)/)
  assert.match(reader, /srtTransportCommand === 'pause'[^\n]+transportPause\(\)/)
  assert.match(reader, /else transportStop\(\)/)
  assert.match(reader, /srtTransportCommand === 'record'[^\n]+transportRecord\(\)/)
  assert.match(store, /requestSrtRecord\(\)/)
})

test('Unified hides duplicate staff tape controls but preserves Classic', () => {
  assert.match(unified, /<ScrollingSightReader[^>]*unified-transport/)
  assert.match(reader, /v-if="!unifiedTransport" class="tape-deck"/)
  assert.match(unified, /store\.requestSrtPlay\(\)/)
  assert.match(unified, /store\.requestSrtStop\(\)/)
})

test('Cosmic pane always exposes Send to Staff and independent narrative controls', () => {
  assert.match(unified, /label="Send to Staff"/)
  assert.match(unified, /getElementById\('freeStaff'\)/)
  assert.match(unified, /embed-narrative/)
  assert.match(cosmic, /html\.embedded\.embed-narrative \.side/)
  assert.match(cosmic, /id="pathNarrative"/)
})
