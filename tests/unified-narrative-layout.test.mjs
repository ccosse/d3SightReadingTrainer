import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const ui = readFileSync(new URL('../src/pages/UnifiedWorkspace.vue', import.meta.url), 'utf8')
const cosmic = readFileSync(new URL('../public/cosmic-harmony.html', import.meta.url), 'utf8')

test('app-wide session sidebar remains collapsible and independent', () => {
  assert.match(ui, /v-show="rightOpen"/)
  assert.match(ui, /rightOpen = !rightOpen/)
  assert.match(ui, /class="session-steps"/)
})
test('session inspector uses stable path step identities and follows active index', () => {
  assert.match(ui, /:key="step.stepId"/)
  assert.match(ui, /index === store.musicalSession.activeIndex/)
  assert.match(ui, /store.musicalSession.focus.midis/)
})
test('Cosmic narrative and its secondary controls use one vertical scrollbar in embed', () => {
  assert.match(cosmic, /html\.embedded\.embed-narrative \.side \{[^}]*overflow-y:auto/)
  assert.match(cosmic, /html\.embedded\.embed-narrative \.side > #pathNarrative \{[^}]*flex:0 0 auto;[^}]*max-height:none;[^}]*overflow:visible/)
  assert.match(cosmic, /html\.embedded\.embed-narrative \.side > #current \{[^}]*order:1;[^}]*border-top:/)
  assert.match(cosmic, /html\.embedded\.embed-narrative \.side > #history \{[^}]*flex-wrap:wrap;[^}]*overflow:visible/)
  assert.match(cosmic, /html\.embedded\.embed-narrative \.side > #notes \{[^}]*overflow:visible/)
})
test('standalone Cosmic Harmony remains separate from embedded adjustments', () => {
  assert.match(cosmic, /html\.embedded\.embed-narrative \.layout/)
  assert.match(ui, /getElementById\('freeStaff'\)/)
})
