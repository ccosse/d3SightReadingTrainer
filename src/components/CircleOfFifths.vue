<template>
  <section class="circle-wrap">
    <svg
      class="circle-svg"
      viewBox="0 0 400 400"
      role="img"
      aria-label="Interactive circle of fifths with pink major-key ring, blue relative-minor ring, and miniature key signatures"
    >
      <g v-for="sector in sectors" :key="sector.index" class="circle-sector">
        <title>{{ sector.tooltip }}</title>

        <path
          :d="sector.majorPath"
          class="major-sector"
          :class="{ active: sector.active && store.currentMode === 'major' }"
          @click="choose(sector.entry, 'major')"
        />
        <path
          :d="sector.minorPath"
          class="minor-sector"
          :class="{ active: sector.active && store.currentMode === 'minor' }"
          @click="choose(sector.entry, 'minor')"
        />
        <path
          :d="sector.signaturePath"
          class="signature-sector"
          :class="{ active: sector.active }"
          @click="choose(sector.entry, 'major')"
        />

        <text
          :x="sector.majorX"
          :y="sector.majorY"
          text-anchor="middle"
          class="major-label"
          @click="choose(sector.entry, 'major')"
        >{{ sector.entry.label }}</text>

        <text
          :x="sector.minorX"
          :y="sector.minorY"
          text-anchor="middle"
          class="minor-label"
          @click="choose(sector.entry, 'minor')"
        >{{ sector.entry.minor }}</text>

        <g
          class="mini-signature"
          :transform="`translate(${sector.signatureX} ${sector.signatureY})`"
          @click="choose(sector.entry, 'major')"
        >
          <line v-for="lineY in [-6, -3, 0, 3, 6]" :key="lineY" x1="-20" x2="20" :y1="lineY" :y2="lineY" />
          <text
            v-if="!sector.signatureMarks.length"
            x="0"
            y="3"
            text-anchor="middle"
            class="natural-signature"
          >—</text>
          <text
            v-for="mark in sector.signatureMarks"
            :key="mark.index"
            :x="mark.x"
            :y="mark.y"
            text-anchor="middle"
            class="signature-mark"
          >{{ mark.char }}</text>
        </g>
      </g>

      <circle cx="200" cy="200" r="66" class="center-disc" />
      <text
        x="200"
        y="194"
        text-anchor="middle"
        class="center-key"
        :class="{ active: store.currentMode === 'major' }"
      >{{ store.currentKey.label }}</text>
      <text
        x="200"
        y="222"
        text-anchor="middle"
        class="center-minor"
        :class="{ active: store.currentMode === 'minor' }"
      >{{ store.currentMinorLabel }}</text>
      <text x="200" y="241" text-anchor="middle" class="center-signature">{{ store.keySignatureSummary }}</text>
    </svg>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { CIRCLE_OF_FIFTHS, keyById, signatureLabel } from '../music/theory'
import { useNoteMapStore } from '../stores/noteMap'

const store = useNoteMapStore()
const cx = 200
const cy = 200

function polar(radius, angle) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle)
  }
}

function ringSectorPath(startAngle, endAngle, innerRadius, outerRadius) {
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

function signatureMarks(signature) {
  if (!signature) return []
  const count = Math.abs(signature)
  const char = signature > 0 ? '♯' : '♭'
  const yOffsets = signature > 0
    ? [-5, 1, -8, -2, 4, -5, 1]
    : [3, -3, 5, -1, 6, 0, 7]
  const spacing = count > 5 ? 5 : 5.8
  const start = -((count - 1) * spacing) / 2
  return Array.from({ length: count }, (_, index) => ({
    index,
    char,
    x: start + index * spacing,
    y: yOffsets[index] + 3
  }))
}

const sectors = computed(() => CIRCLE_OF_FIFTHS.map((entry, index) => {
  const centerAngle = -Math.PI / 2 + index * Math.PI / 6
  const startAngle = centerAngle - Math.PI / 12
  const endAngle = centerAngle + Math.PI / 12
  const major = polar(173, centerAngle)
  const minor = polar(137, centerAngle)
  const signature = polar(98, centerAngle)
  const key = keyById(resolvedId(entry))
  return {
    index,
    entry,
    majorPath: ringSectorPath(startAngle, endAngle, 153, 192),
    minorPath: ringSectorPath(startAngle, endAngle, 116, 153),
    signaturePath: ringSectorPath(startAngle, endAngle, 68, 116),
    majorX: major.x,
    majorY: major.y + 5,
    minorX: minor.x,
    minorY: minor.y + 4,
    signatureX: signature.x,
    signatureY: signature.y,
    signatureMarks: signatureMarks(key.signature),
    active: entry.ids.includes(store.currentKeyId),
    tooltip: `Select ${key.label} major: ${signatureLabel(key.signature)}; relative ${key.relativeMinor}`
  }
}))

function choose(entry, mode = 'major') {
  store.setKey(resolvedId(entry), { mode })
}
</script>

<style scoped>
.circle-wrap { width: 100%; aspect-ratio: 1; margin: 0 auto; }
.circle-svg { width: 100%; height: 100%; display: block; }
.major-sector,
.minor-sector,
.signature-sector { cursor: pointer; transition: fill 130ms ease, stroke 130ms ease, filter 130ms ease; }
.major-sector { fill: rgba(199, 119, 193, 0.82); stroke: rgba(247, 211, 244, 0.62); stroke-width: 1; }
.minor-sector { fill: rgba(112, 139, 207, 0.82); stroke: rgba(210, 222, 255, 0.55); stroke-width: 1; }
.signature-sector { fill: rgba(239, 239, 239, 0.82); stroke: rgba(70, 70, 70, 0.7); stroke-width: 1; }
.circle-sector:hover .major-sector { fill: rgba(220, 137, 213, 0.96); }
.circle-sector:hover .minor-sector { fill: rgba(132, 160, 230, 0.96); }
.circle-sector:hover .signature-sector { fill: rgba(255, 255, 255, 0.96); }
.major-sector.active { fill: rgba(239, 92, 186, 0.98); stroke: #fff; filter: drop-shadow(0 0 4px rgba(239, 92, 186, 0.62)); }
.minor-sector.active { fill: rgba(62, 139, 235, 0.98); stroke: #e8f4ff; }
.signature-sector.active { fill: rgba(211, 243, 255, 0.98); stroke: #fff; }
.major-label { fill: #fff; font-size: 18px; font-weight: 700; cursor: pointer; paint-order: stroke; stroke: rgba(43, 22, 42, 0.5); stroke-width: 1.4px; }
.minor-label { fill: #fff; font-size: 15px; font-weight: 600; cursor: pointer; paint-order: stroke; stroke: rgba(28, 40, 74, 0.55); stroke-width: 1.2px; }
.mini-signature { cursor: pointer; }
.mini-signature line { stroke: rgba(33, 33, 33, 0.76); stroke-width: 0.7; }
.signature-mark { fill: #202020; font-size: 12px; font-weight: 700; }
.natural-signature { fill: #555; font-size: 12px; }
.center-disc { fill: rgba(31, 31, 31, 0.78); stroke: rgba(255, 255, 255, 0.45); stroke-width: 1.5; }
.center-key, .center-minor { fill: #ddd; font-size: 30px; font-weight: 450; }
.center-key.active, .center-minor.active { fill: #fff; font-weight: 800; }
.center-minor { font-size: 25px; }
.center-signature { fill: #a9d9ff; font-size: 14px; }
</style>
