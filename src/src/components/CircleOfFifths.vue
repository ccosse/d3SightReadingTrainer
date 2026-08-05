<template>
  <section class="circle-wrap">
    <svg
      class="circle-svg"
      viewBox="0 0 360 360"
      role="img"
      aria-label="Interactive circle of fifths with major keys, relative minor keys, and key signatures"
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

        <g class="mini-signature" @click="choose(sector.entry)">
          <line
            v-for="offset in [-6, -3, 0, 3, 6]"
            :key="offset"
            :x1="sector.signatureX - 18"
            :x2="sector.signatureX + 18"
            :y1="sector.signatureY + offset"
            :y2="sector.signatureY + offset"
          />
          <text
            :x="sector.signatureX"
            :y="sector.signatureY + 2.5"
            text-anchor="middle"
          >{{ sector.signatureGlyphs }}</text>
        </g>
      </g>

      <circle cx="180" cy="180" r="52" class="center-disc" />
      <text x="180" y="170" text-anchor="middle" class="center-key">{{ store.currentKey.label }}</text>
      <text x="180" y="190" text-anchor="middle" class="center-sub">major</text>
      <text x="180" y="207" text-anchor="middle" class="center-signature">{{ store.keySignatureSummary }}</text>
    </svg>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { CIRCLE_OF_FIFTHS, compactSignature, keyById, signatureLabel } from '../music/theory'
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

function ringSectorPath(startAngle, endAngle, innerRadius = 56, outerRadius = 166) {
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
  const major = polar(139, centerAngle)
  const minor = polar(108, centerAngle)
  const signature = polar(78, centerAngle)
  const key = keyById(resolvedId(entry))
  return {
    index,
    entry,
    path: ringSectorPath(startAngle, endAngle),
    labelX: major.x,
    labelY: major.y + 4,
    minorX: minor.x,
    minorY: minor.y + 3,
    signatureX: signature.x,
    signatureY: signature.y,
    signatureGlyphs: compactSignature(key.signature),
    active: entry.ids.includes(store.currentKeyId),
    tooltip: `Select ${key.label} major: ${signatureLabel(key.signature)}; relative ${key.relativeMinor}`
  }
}))

function choose(entry) {
  store.setKey(resolvedId(entry))
}
</script>

<style scoped>
.circle-wrap { width: min(100%, 420px); margin: 0 auto; }
.circle-svg { width: 100%; height: auto; display: block; }
.sector { fill: #444; stroke: #777; stroke-width: 1; cursor: pointer; transition: fill 120ms ease; }
.sector:hover { fill: #565656; }
.sector.active { fill: var(--q-primary); stroke: #cde9ff; }
.major-label { fill: #fff; font-size: 11px; font-weight: 600; cursor: pointer; }
.minor-label { fill: #d3d3d3; font-size: 8px; cursor: pointer; }
.mini-signature { cursor: pointer; }
.mini-signature line { stroke: rgba(255, 255, 255, 0.48); stroke-width: 0.7; }
.mini-signature text { fill: #f3f3f3; font-size: 7px; font-weight: 600; }
.center-disc { fill: #252525; stroke: #777; stroke-width: 1.4; }
.center-key { fill: #fff; font-size: 28px; font-weight: 600; }
.center-sub { fill: #d7d7d7; font-size: 12px; }
.center-signature { fill: #a9d9ff; font-size: 9px; }
</style>
