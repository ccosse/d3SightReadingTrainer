import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const routesSource = readFileSync(new URL('../src/router/routes.js', import.meta.url), 'utf8')

test('the root route redirects into the unified workspace', () => {
  assert.match(routesSource, /\{\s*path:\s*''\s*,\s*redirect:\s*'\/unified'\s*\}/)
})

test('both workspaces remain independently addressable', () => {
  assert.match(routesSource, /path:\s*'unified',\s*component:\s*\(\)\s*=>\s*import\('\.\.\/pages\/UnifiedWorkspace.vue'\)/)
  assert.match(routesSource, /path:\s*'classic',\s*component:\s*\(\)\s*=>\s*import\('\.\.\/pages\/IndexPage.vue'\)/)
})
