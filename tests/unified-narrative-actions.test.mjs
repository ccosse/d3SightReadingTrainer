import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const cosmic = readFileSync(new URL('../public/cosmic-harmony.html', import.meta.url), 'utf8')
const unified = readFileSync(new URL('../src/pages/UnifiedWorkspace.vue', import.meta.url), 'utf8')

test('pinned narrative row exposes three priority actions plus an optional menu', () => {
  for (const id of ['narrativeBack', 'narrativeReset', 'narrativeStaff', 'narrativeMore']) {
    assert.match(cosmic, new RegExp(`id="${id}"`))
  }
  assert.match(cosmic, /html\.embedded\.embed-narrative \.side > #narrativeActionBar \{[^}]*position:sticky;[^}]*top:/)
  assert.match(cosmic, /#narrativeActionBar \{ display:none; \}/)
  assert.match(cosmic, /html\.embedded\.embed-narrative \.side > \.buttons \{ display:none; \}/)
  assert.match(cosmic, /html\.embedded\.embed-narrative \.side > #pathNarrative \{[^}]*max-height:none;[^}]*overflow:visible/)
})

test('pinned commands delegate to existing Cosmic handlers without changing Classic actions', () => {
  for (const [a, b] of [['narrativeBack', 'back'], ['narrativeReset', 'reset'], ['narrativeStaff', 'freeStaff'], ['narrativeSave', 'save'], ['narrativeCopy', 'copy'], ['narrativeReveal', 'reveal'], ['narrativeExample', 'example']]) {
    assert.ok(cosmic.includes(`['${a}','${b}']`), `Missing delegated action ${a}`)
  }
  assert.match(cosmic, /el\('narrativeSaveName'\)\.value/)
  assert.match(cosmic, /el\('narrativeStaff'\)\.disabled = history\.length < 2/)
  assert.match(unified, /pane\.id === 'cosmic' && !cosmicNarrativeOpen[^>]*label="Send to Staff"/)
})
