<template>
  <section class="circle-wrap">
    <svg
      class="circle-svg"
      viewBox="0 0 360 360"
      role="img"
      aria-label="Interactive circle of fifths linked to key signatures and instrument views"
    >
      <g v-for="sector in sectors" :key="sector.index">
        <title>{{ sector.tooltip }}</title>
        <path
          :d="sector.path"
          class="sector"
          :class="{ active: sector.active }"
          @click="choose(sector.entry)"
        />
        <text
          :x="sector.labelX"
          :y="sector.labelY"
          text-anchor="middle"
          class="major-label"
          @click="choose(sector.entry)"
        >{{ sector.entry.label }}</text>
        <text
          :x="sector.minorX"
          :y="sector.minorY"
          text-anchor="middle"
          class="minor-label"
          @click="choose(sector.entry)"
        >{{ sector.entry.minor }}</text>
      </g>

      <circle cx="180" cy="180" r="66" class="center-disc" />
      <text x="180" y="169" text-anchor="middle" class="center-key">{{ store.currentKey.label }}</text>
      <text x="180" y="193" text-anchor="middle" class="center-sub">major</text>
      <text x="180" y="214" text-anchor="middle" class="center-signature">{{ store.keySignatureSummary }}</text>
    </svg>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { CIRCLE_OF_FIFTHS, keyById, signatureLabel } from '../music/theory'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const cx = 180
const cy = 180

function polar(radius, angle) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle)
  }
}

function ringSectorPath(startAngle, endAngle, innerRadius = 70, outerRadius = 166) {
  const outerStart = polar(outerRadius, startAngle)
  const outerEnd = polar(outerRadius, endAngle)
  const innerEnd = polar(innerRadius, endAngle)
  const innerStart = polar(innerRadius, startAngle)
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    'Z'
  ].join(' ')
}

function resolvedId(entry) {
  if (entry.ids.includes(store.currentKeyId)) return store.currentKeyId
  if (entry.ids.length === 1) return entry.ids[0]
  return store.accidentalMode === 'flat' ? entry.ids[entry.ids.length - 1] : entry.ids[0]
}

const sectors = computed(() => CIRCLE_OF_FIFTHS.map((entry, index) => {
  const centerAngle = -Math.PI / 2 + index * Math.PI / 6
  const startAngle = centerAngle - Math.PI / 12
  const endAngle = centerAngle + Math.PI / 12
  const major = polar(132, centerAngle)
  const minor = polar(93, centerAngle)
  const key = keyById(resolvedId(entry))
  return {
    index,
    entry,
    path: ringSectorPath(startAngle, endAngle),
    labelX: major.x,
    labelY: major.y + 4,
    minorX: minor.x,
    minorY: minor.y + 4,
    active: entry.ids.includes(store.currentKeyId),
    tooltip: `Select ${key.label} major: ${signatureLabel(key.signature)}; relative ${key.relativeMinor}`
  }
}))

function choose(entry) {
  store.setKey(resolvedId(entry))
}
</script>

<style scoped>
.circle-wrap { width: min(100%, 520px); margin: 0 auto; }
.circle-svg { width: 100%; height: auto; display: block; }
.sector { fill: #444; stroke: #777; stroke-width: 1; cursor: pointer; transition: fill 120ms ease; }
.sector:hover { fill: #565656; }
.sector.active { fill: var(--q-primary); stroke: #cde9ff; }
.major-label { fill: #fff; font-size: 12px; font-weight: 600; cursor: pointer; }
.minor-label { fill: #d0d0d0; font-size: 9px; cursor: pointer; }
.center-disc { fill: #252525; stroke: #666; stroke-width: 1.5; }
.center-key { fill: #fff; font-size: 31px; font-weight: 600; }
.center-sub { fill: #d7d7d7; font-size: 14px; }
.center-signature { fill: #a9d9ff; font-size: 10px; }
</style>
