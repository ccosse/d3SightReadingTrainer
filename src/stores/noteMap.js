import { defineStore } from 'pinia'
import { keyboardPresetById } from '../music/keyboardPresets'
import {
  configureAudioEngine,
  requestMidiOutputs,
  setInstrumentProgram,
  setMidiChannel,
  setMidiOutput,
  setSustain
} from '../music/audio'
import {
  FLAT_NAMES,
  MAJOR_KEYS,
  SHARP_NAMES,
  halfStepsFromCForKey,
  keyById,
  keyForHalfStepsFromC,
  keyPitchClasses,
  mod12,
  signatureLabel
} from '../music/theory'

const DEFAULT_COMPONENT_ORDER = ['controls', 'staff', 'piano', 'guitar']
const STAFF_LENGTH_BEATS = 8
const CLIP_STORAGE_KEY = 'd3srt-clips-v1'

function readSavedClips() {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CLIP_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistClips(clips) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(CLIP_STORAGE_KEY, JSON.stringify(clips)) } catch { /* storage is optional */ }
}

function roundBeat(value, quantum) {
  const q = Math.max(0.25, Number(quantum) || 0.5)
  return Math.max(0, Math.round(Number(value) / q) * q)
}

export const useNoteMapStore = defineStore('noteMap', {
  state: () => ({
    activeTab: 'note-map',
    selectedPitchClasses: [7],
    selectionMode: 'single',
    accidentalMode: 'sharp',
    currentKeyId: 'C',
    currentMode: 'major',
    halfStepsFromC: 0,
    showKeyOverlay: false,
    keySelectsTonic: true,
    showAllNoteNames: false,
    showPianoLabels: typeof window !== 'undefined' && window.localStorage.getItem('d3srt-show-piano-labels') === 'true',
    showGuitarStrings: true,
    showGuitarFrets: true,
    showNeckDots: true,
    notesAsDots: true,
    notesAsNames: false,
    showOctavesFromE: false,
    showFretNumbers: true,
    fretboardZoom: 1,
    keyboardPreset: '88',
    audioEngine: 'electric-piano',
    audioEngineStatus: 'ready',
    audioEngineError: '',
    audioProgram: 4,
    audioSustain: false,
    midiOutputs: [],
    midiOutputId: '',
    midiChannel: 0,
    staffZoom: 1,
    visibleObjects: {
      controls: true,
      piano: true,
      guitar: true,
      staff: true
    },
    componentOrder: [...DEFAULT_COMPONENT_ORDER],
    leftDrawerOpen: true,
    rightDrawerOpen: true,
    rightDrawerMode: 'dock',
    fifthsFullscreenOpen: false,
    tooltipsEnabled: true,
    focusText: 'Select a note on any linked view',

    scanPlaying: false,
    scanProgress: 0,
    scanTempo: 96,
    playingTokens: [],
    nextPlayingToken: 1,

    staffLengthBeats: STAFF_LENGTH_BEATS,
    staffQuantize: 0.5,
    staffEvents: [],
    selectedStaffBeat: null,
    nextStaffEventId: 1,

    srtPlaying: false,
    srtTransportState: 'stopped',
    srtTransportCommand: 'stop',
    srtTransportNonce: 0,
    srtTempo: 72,
    srtEventSpacing: 1,
    srtMaterial: 'mixed',
    srtMotion: 'voice-led',
    srtClefMode: 'alternate',
    srtRange: 'comfortable',
    srtSource: 'generated',
    srtShowLabels: false,
    srtLoopManual: true,
    srtGenerationNonce: 0,
    srtStyle: 'free',
    srtGate: 0.92,
    srtSwing: 0,
    srtChordSize: 'seventh',
    srtChordSizes: ['triad', 'seventh'],
    // Independent note-group permissions for accompaniment hands.
    // Bass staff maps to the left hand; treble staff maps to the right hand.
    srtLeftHandSizes: ['single'],
    srtRightHandSizes: ['triad', 'seventh'],
    // Default hand placement: left hand in the low C1-C2 octave,
    // right hand around middle C in the C4-C5 octave.
    srtTrebleRegions: ['mid'],
    srtBassRegions: ['low'],
    srtTrebleAudio: true,
    srtBassAudio: true,
    srtExerciseMode: 'mode-1',
    srtBassPattern: 'walk',
    srtProgression: 'auto',
    srtRiffFlavor: 'blues-hook',
    srtDynamics: 'natural',
    clipSelectionStart: null,
    clipSelectionEnd: null,
    clips: readSavedClips(),
    staffDragPayload: null
  }),

  getters: {
    noteNames: (state) => state.accidentalMode === 'flat' ? FLAT_NAMES : SHARP_NAMES,
    currentKey: (state) => keyById(state.currentKeyId),
    currentMinorLabel() {
      return this.currentKey.relativeMinor.replace(/ minor$/, 'm')
    },
    activeScaleNames() {
      if (this.currentMode !== 'minor') return this.currentKey.scale
      return [5, 6, 0, 1, 2, 3, 4].map((index) => this.currentKey.scale[index])
    },
    compositionKey() {
      return { ...this.currentKey, mode: this.currentMode }
    },
    selectedSet: (state) => new Set(state.selectedPitchClasses),
    keyPitchClassSet() {
      return new Set(keyPitchClasses(this.currentKey, this.currentMode))
    },
    isAllSelected: (state) => state.selectedPitchClasses.length === 12,
    hasSelection: (state) => state.selectedPitchClasses.length > 0,
    isSelected: (state) => (pitchClass) => state.selectedPitchClasses.includes(mod12(pitchClass)),
    isInCurrentKey() {
      return (pitchClass) => this.keyPitchClassSet.has(mod12(pitchClass))
    },
    scaleDegree() {
      return (pitchClass) => {
        const index = keyPitchClasses(this.currentKey, this.currentMode).indexOf(mod12(pitchClass))
        return index >= 0 ? index + 1 : null
      }
    },
    noteName() {
      return (pitchClass) => this.noteNames[mod12(pitchClass)]
    },
    selectedSummary() {
      if (this.isAllSelected) return 'All pitch classes'
      return this.selectedPitchClasses.map((pc) => this.noteName(pc)).join(', ') || 'None'
    },
    keySignatureSummary() {
      return signatureLabel(this.currentKey.signature)
    },
    keyOptions: () => MAJOR_KEYS.map((key) => ({ label: `${key.label} major`, value: key.id })),
    keyboardDefinition: (state) => keyboardPresetById(state.keyboardPreset),
    playingMidis: (state) => [...new Set(state.playingTokens.map((entry) => entry.midi))],
    playingMidiSet() {
      return new Set(this.playingMidis)
    },
    isPlayingMidi() {
      return (midi) => this.playingMidiSet.has(Number(midi))
    },
    playingPitchClassSet() {
      return new Set(this.playingMidis.map(mod12))
    },
    isPlayingPitchClass() {
      return (pitchClass) => this.playingPitchClassSet.has(mod12(pitchClass))
    },
    staffVisibleBeats: (state) => {
      const measures = Math.max(1, Math.min(6, Math.round((1120 / (126 * state.staffZoom)) / 4)))
      return measures * 4
    },
    staffSequenceBeats() {
      const eventEnd = this.staffEvents.reduce((max, event) => Math.max(max, event.beat + (event.duration || 1)), 0)
      return Math.max(STAFF_LENGTH_BEATS, Math.ceil(eventEnd / 4) * 4)
    },
    hasStaffSequence: (state) => state.staffEvents.length > 0,
    staffClusters: (state) => {
      const map = new Map()
      for (const event of state.staffEvents) {
        if (!map.has(event.beat)) map.set(event.beat, [])
        map.get(event.beat).push(event)
      }
      return [...map.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([beat, events]) => ({
          beat,
          duration: Math.max(...events.map((event) => event.duration || 1)),
          events: [...events].sort((a, b) => a.midi - b.midi)
        }))
    },
    selectedStaffCluster() {
      if (this.selectedStaffBeat === null) return null
      return this.staffClusters.find((cluster) => cluster.beat === this.selectedStaffBeat) || null
    }
  },

  actions: {
    selectPitchClass(pitchClass) {
      const pc = mod12(pitchClass)
      if (this.selectionMode === 'single') {
        this.selectedPitchClasses = [pc]
        return
      }
      const index = this.selectedPitchClasses.indexOf(pc)
      if (index >= 0) this.selectedPitchClasses.splice(index, 1)
      else this.selectedPitchClasses.push(pc)
    },

    togglePitchClass(pitchClass) {
      this.selectPitchClass(pitchClass)
    },

    selectAll() {
      this.selectedPitchClasses = Array.from({ length: 12 }, (_, index) => index)
    },

    clearSelection() {
      this.selectedPitchClasses = []
    },

    toggleAllNone() {
      if (this.hasSelection) this.clearSelection()
      else this.selectAll()
    },

    setSelectionMode(mode) {
      if (mode !== 'single' && mode !== 'multi') return
      this.selectionMode = mode
      if (mode === 'single' && this.selectedPitchClasses.length > 1 && !this.isAllSelected) {
        this.selectedPitchClasses = [this.selectedPitchClasses[0]]
      }
    },

    setKey(keyId, options = {}) {
      const { syncTranspose = true, mode = 'major' } = options
      const key = keyById(keyId)
      this.currentKeyId = key.id
      this.currentMode = mode === 'minor' ? 'minor' : 'major'
      this.accidentalMode = key.accidentalMode
      if (syncTranspose) this.halfStepsFromC = halfStepsFromCForKey(key)
      if (this.keySelectsTonic && this.selectionMode === 'single') {
        this.selectedPitchClasses = [mode === 'minor' ? mod12(key.tonic + 9) : key.tonic]
      }
      this.srtGenerationNonce += 1
    },

    setMode(mode) {
      this.currentMode = mode === 'minor' ? 'minor' : 'major'
    },

    setHalfStepsFromC(value) {
      const steps = Math.max(-12, Math.min(12, Math.round(Number(value) || 0)))
      this.halfStepsFromC = steps
      this.setKey(keyForHalfStepsFromC(steps).id, { syncTranspose: false, mode: 'major' })
    },

    setFretboardZoom(value) {
      this.fretboardZoom = Math.max(0.75, Math.min(1.6, Number(value) || 1))
    },

    setKeyboardPreset(id) {
      this.keyboardPreset = keyboardPresetById(id).id
    },

    async setAudioEngine(engine) {
      this.audioEngine = engine
      this.audioEngineStatus = 'loading'
      this.audioEngineError = ''
      try {
        await configureAudioEngine(engine, {
          program: this.audioProgram,
          channel: this.midiChannel,
          outputId: this.midiOutputId
        })
        if (engine === 'web-midi') await this.refreshMidiOutputs()
        this.audioEngineStatus = 'ready'
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.audioEngine = 'electric-piano'
        await configureAudioEngine('electric-piano', { program: this.audioProgram })
        this.audioEngineStatus = 'error'
        this.audioEngineError = `${message}. Using the internal electric piano instead.`
      }
    },

    async setAudioProgram(program) {
      this.audioProgram = Math.max(0, Math.min(127, Math.round(Number(program) || 0)))
      this.audioEngineStatus = this.audioEngine === 'soundfont' ? 'loading' : this.audioEngineStatus
      try {
        await setInstrumentProgram(this.audioProgram)
        if (this.audioEngine === 'soundfont') this.audioEngineStatus = 'ready'
      } catch (error) {
        this.audioEngineStatus = 'error'
        this.audioEngineError = error instanceof Error ? error.message : String(error)
      }
    },

    async refreshMidiOutputs() {
      try {
        this.midiOutputs = await requestMidiOutputs()
        if (!this.midiOutputId && this.midiOutputs.length) {
          this.midiOutputId = this.midiOutputs[0].value
          setMidiOutput(this.midiOutputId)
        }
        if (this.audioEngine === 'web-midi') this.audioEngineStatus = 'ready'
      } catch (error) {
        this.midiOutputs = []
        this.audioEngineStatus = 'error'
        this.audioEngineError = error instanceof Error ? error.message : String(error)
      }
    },

    setMidiOutputId(id) {
      this.midiOutputId = String(id || '')
      setMidiOutput(this.midiOutputId)
    },

    setMidiChannelValue(channel) {
      this.midiChannel = Math.max(0, Math.min(15, Math.round(Number(channel) || 0)))
      setMidiChannel(this.midiChannel)
    },

    setAudioSustain(value) {
      this.audioSustain = Boolean(value)
      setSustain(this.audioSustain)
    },

    setRightDrawerMode(mode) {
      this.rightDrawerMode = mode === 'overlay' ? 'overlay' : 'dock'
    },

    toggleRightDrawerMode() {
      this.rightDrawerMode = this.rightDrawerMode === 'dock' ? 'overlay' : 'dock'
    },

    setStaffZoom(value) {
      this.staffZoom = Math.max(0.35, Math.min(2.25, Number(value) || 1))
    },

    setStaffVisibleBars(value) {
      const bars = Math.max(1, Math.min(6, Math.round(Number(value) || 2)))
      this.staffZoom = Math.max(0.35, Math.min(2.25, (1120 / 126) / (bars * 4)))
    },

    setVisibleObject(name, value) {
      if (Object.hasOwn(this.visibleObjects, name)) this.visibleObjects[name] = Boolean(value)
    },

    moveComponent(sourceId, targetId) {
      if (sourceId === targetId) return
      const from = this.componentOrder.indexOf(sourceId)
      const to = this.componentOrder.indexOf(targetId)
      if (from < 0 || to < 0) return

      const next = [...this.componentOrder]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      this.componentOrder = next
    },

    moveComponentBy(id, delta) {
      const from = this.componentOrder.indexOf(id)
      const to = from + delta
      if (from < 0 || to < 0 || to >= this.componentOrder.length) return
      const next = [...this.componentOrder]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      this.componentOrder = next
    },

    resetComponentOrder() {
      this.componentOrder = [...DEFAULT_COMPONENT_ORDER]
    },

    setFocus(text) {
      this.focusText = text
    },

    setScanTempo(value) {
      this.scanTempo = Math.max(40, Math.min(220, Math.round(Number(value) || 96)))
    },

    setScanProgress(value) {
      this.scanProgress = Math.max(0, Math.min(1, Number(value) || 0))
    },

    setScanPlaying(value) {
      this.scanPlaying = Boolean(value)
      if (!this.scanPlaying) this.scanProgress = 0
    },

    beginPlaying(midis, source = 'playback') {
      const token = this.nextPlayingToken
      this.nextPlayingToken += 1
      const unique = [...new Set((midis || []).map((midi) => Math.round(Number(midi))).filter(Number.isFinite))]
      this.playingTokens.push(...unique.map((midi) => ({ token, midi, source })))
      return token
    },

    endPlaying(token) {
      this.playingTokens = this.playingTokens.filter((entry) => entry.token !== token)
    },

    clearPlaying(source = null) {
      this.playingTokens = source
        ? this.playingTokens.filter((entry) => entry.source !== source)
        : []
    },

    setStaffDragPayload(payload) {
      this.staffDragPayload = payload && typeof payload === 'object'
        ? JSON.parse(JSON.stringify(payload))
        : null
    },

    clearStaffDragPayload() {
      this.staffDragPayload = null
    },

    setStaffQuantize(value) {
      const allowed = [0.25, 0.5, 1]
      const numeric = Number(value)
      this.staffQuantize = allowed.includes(numeric) ? numeric : 0.5
    },

    addStaffNote({ midi, beat, duration = 1 }) {
      const normalizedMidi = Math.max(24, Math.min(96, Math.round(Number(midi))))
      const normalizedBeat = roundBeat(beat, this.staffQuantize)
      const existing = this.staffEvents.find((event) => event.beat === normalizedBeat && event.midi === normalizedMidi)
      if (existing) {
        this.selectedStaffBeat = normalizedBeat
        return existing.id
      }

      const id = this.nextStaffEventId
      this.nextStaffEventId += 1
      this.staffEvents.push({
        id,
        midi: normalizedMidi,
        beat: normalizedBeat,
        duration: Math.max(0.25, Math.min(4, Number(duration) || 1))
      })
      this.selectedStaffBeat = normalizedBeat
      return id
    },

    updateStaffEvent(id, changes = {}) {
      const event = this.staffEvents.find((item) => item.id === id)
      if (!event) return
      if (changes.midi !== undefined) event.midi = Math.max(24, Math.min(96, Math.round(Number(changes.midi))))
      if (changes.beat !== undefined) event.beat = roundBeat(changes.beat, this.staffQuantize)
      if (changes.duration !== undefined) event.duration = Math.max(0.25, Math.min(4, Number(changes.duration) || 1))
      this.selectedStaffBeat = event.beat
    },

    setSelectedStaffBeat(beat) {
      this.selectedStaffBeat = beat === null ? null : Number(beat)
    },

    setStaffClusterDuration(beat, duration) {
      const normalized = Math.max(0.25, Math.min(4, Number(duration) || 1))
      this.staffEvents
        .filter((event) => event.beat === Number(beat))
        .forEach((event) => { event.duration = normalized })
    },

    moveStaffCluster(fromBeat, toBeat) {
      const source = Number(fromBeat)
      const target = roundBeat(toBeat, this.staffQuantize)
      this.staffEvents
        .filter((event) => event.beat === source)
        .forEach((event) => { event.beat = target })

      const seen = new Set()
      this.staffEvents = this.staffEvents.filter((event) => {
        const key = `${event.beat}:${event.midi}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      this.selectedStaffBeat = target
    },

    removeStaffEvent(id) {
      this.staffEvents = this.staffEvents.filter((event) => event.id !== id)
      if (!this.staffEvents.some((event) => event.beat === this.selectedStaffBeat)) this.selectedStaffBeat = null
    },

    removeStaffCluster(beat) {
      const target = Number(beat)
      this.staffEvents = this.staffEvents.filter((event) => event.beat !== target)
      if (this.selectedStaffBeat === target) this.selectedStaffBeat = null
    },

    clearStaffSequence() {
      this.staffEvents = []
      this.selectedStaffBeat = null
    },

    replaceStaffSequence(events = []) {
      this.staffEvents = []
      this.selectedStaffBeat = null
      this.nextStaffEventId = 1
      for (const event of events) {
        const beat = roundBeat(event.beat, this.staffQuantize)
        for (const midi of event.midis || []) {
          this.addStaffNote({
            midi,
            beat,
            duration: Math.max(0.25, Math.min(4, Number(event.duration) || 1))
          })
        }
      }
      this.selectedStaffBeat = null
    },

    setSrtTransportState(state) {
      const next = ['playing', 'paused', 'stopped'].includes(state) ? state : 'stopped'
      this.srtTransportState = next
      this.srtPlaying = next === 'playing'
    },

    setSrtPlaying(value) {
      this.setSrtTransportState(value ? 'playing' : 'stopped')
    },

    requestSrtPlay() {
      this.srtTransportCommand = 'play'
      this.srtTransportNonce += 1
    },

    requestSrtStart() {
      this.requestSrtPlay()
    },

    requestSrtPause() {
      this.srtTransportCommand = 'pause'
      this.srtTransportNonce += 1
    },

    requestSrtStop() {
      this.srtTransportCommand = 'stop'
      this.srtTransportNonce += 1
    },

    requestSrtSave() {
      this.srtTransportCommand = 'save'
      this.srtTransportNonce += 1
    },

    setSrtTempo(value) {
      this.srtTempo = Math.max(30, Math.min(220, Math.round(Number(value) || 72)))
    },

    setSrtEventSpacing(value) {
      const allowed = [0.5, 1, 2]
      const numeric = Number(value)
      this.srtEventSpacing = allowed.includes(numeric) ? numeric : 1
      this.srtGenerationNonce += 1
    },

    setSrtOption(name, value) {
      const allowed = new Set(['srtMaterial', 'srtMotion', 'srtClefMode', 'srtRange', 'srtSource', 'srtStyle', 'srtChordSize', 'srtExerciseMode', 'srtBassPattern', 'srtProgression', 'srtRiffFlavor', 'srtDynamics'])
      if (!allowed.has(name)) return
      this[name] = value
      this.srtGenerationNonce += 1
    },

    setSrtChordSizes(values) {
      // Legacy/global setter retained for compatibility with older saved UI state.
      const allowed = new Set(['single', 'dyad', 'triad', 'seventh', 'ninth', 'thirteenth'])
      const next = [...new Set((Array.isArray(values) ? values : []).filter((value) => allowed.has(value)))]
      if (!next.length) return
      this.srtChordSizes = next
      this.srtChordSize = next[next.length - 1]
      this.srtGenerationNonce += 1
    },

    setSrtHandSizes(hand, values) {
      const allowed = new Set(['single', 'dyad', 'triad', 'seventh', 'ninth', 'thirteenth'])
      const next = [...new Set((Array.isArray(values) ? values : []).filter((value) => allowed.has(value)))]
      if (!next.length) return
      if (hand === 'left' || hand === 'bass') this.srtLeftHandSizes = next
      else if (hand === 'right' || hand === 'treble') this.srtRightHandSizes = next
      else return
      this.srtGenerationNonce += 1
    },

    setSrtRegion(clef, region, enabled) {
      const property = clef === 'bass' ? 'srtBassRegions' : 'srtTrebleRegions'
      const allowed = new Set(['low', 'mid', 'high'])
      if (!allowed.has(region)) return
      const next = new Set(this[property])
      if (enabled) next.add(region)
      else next.delete(region)
      this[property] = ['low', 'mid', 'high'].filter((item) => next.has(item))
      this.srtGenerationNonce += 1
    },

    setSrtStaffAudio(clef, enabled) {
      if (clef === 'bass') this.srtBassAudio = Boolean(enabled)
      else this.srtTrebleAudio = Boolean(enabled)
    },

    setSrtGate(value) {
      this.srtGate = Math.max(0.25, Math.min(1.4, Number(value) || 0.92))
    },

    setSrtSwing(value) {
      // Swing is applied as a live playback/display offset, so changing it must
      // not rewind or regenerate the tape.
      this.srtSwing = Math.max(0, Math.min(0.45, Number(value) || 0))
    },

    setClipSelection(start, end) {
      const a = Number(start)
      const b = Number(end)
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        this.clipSelectionStart = null
        this.clipSelectionEnd = null
        return
      }
      this.clipSelectionStart = Math.min(a, b)
      this.clipSelectionEnd = Math.max(a, b)
    },

    clearClipSelection() {
      this.clipSelectionStart = null
      this.clipSelectionEnd = null
    },

    saveClip({ name, events, keyId = this.currentKeyId, mode = this.currentMode, tempo = this.srtTempo }) {
      if (!Array.isArray(events) || !events.length) return null
      const clip = {
        id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: String(name || `Clip ${this.clips.length + 1}`),
        createdAt: new Date().toISOString(),
        keyId,
        mode,
        tempo,
        events: events.map((event) => ({
          beat: Number(event.beat) || 0,
          duration: Math.max(0.25, Number(event.duration) || 1),
          midis: [...new Set((event.midis || []).map((midi) => Math.round(Number(midi))).filter(Number.isFinite))]
        }))
      }
      this.clips.unshift(clip)
      persistClips(this.clips)
      return clip.id
    },

    renameClip(id, name) {
      const clip = this.clips.find((item) => item.id === id)
      const nextName = String(name || '').trim()
      if (!clip || !nextName) return
      clip.name = nextName
      persistClips(this.clips)
    },

    removeClip(id) {
      this.clips = this.clips.filter((clip) => clip.id !== id)
      persistClips(this.clips)
    },

    loadClipToStaff(id) {
      const clip = this.clips.find((item) => item.id === id)
      if (!clip) return
      this.setKey(clip.keyId, { mode: clip.mode })
      this.replaceStaffSequence(clip.events)
      this.activeTab = 'note-map'
      this.setFocus(`Loaded ${clip.name} into the editable staff`)
    },

    regenerateSightReading() {
      this.srtGenerationNonce += 1
    }
  }
})
