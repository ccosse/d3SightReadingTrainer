# Quasar App (d3sightreadingtrainer)

## Install the dependencies

```bash
pnpm install
# or: yarn/npm/bun install
```

### Start the app in development mode (HMR, error reporting, etc.)

```bash
quasar dev
```

### Format & Lint the files

```bash
pnpm run lint
# or: yarn/npm/bun run lint
```

...or just check formatting & linting:

```bash
pnpm run lint:check
# or: yarn/npm/bun run lint:check
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-file).

## Cosmic Harmony integration milestone 1

Launch the project normally (`npm install`, then `npm run dev`). A new **Cosmic Harmony · MIDI bridge** panel appears above the unchanged d3SRT workspace. Click **Open Cosmic Harmony** and move the window to your second monitor. Connect one MIDI input (e.g. Yamaha P-71 or Reface CP) from the d3SRT panel. The Cosmic window receives the raw MIDI events via same-origin `BroadcastChannel`, and retains its original chord recognizer and named-path storage. Changing key/mode in d3SRT synchronizes Cosmic (d3SRT minor keys are indexed by relative major internally).

The Cosmic window is served from `public/cosmic-harmony.html`; Quasar copies it to the GitHub Pages build. Both windows must share the same origin, and Web MIDI requires Chrome and HTTPS or localhost. You may also use Cosmic standalone with its original **Connect MIDI** button, but don't connect the same device twice during integration testing.

**Scope:** This milestone does NOT yet write MIDI notes onto the scrolling grand staff, record performances, play SoundFonts from live MIDI, or synchronize Cosmic's manually selected key back to d3SRT. Those are future steps. Existing site behavior has intentionally been left intact. Saved Cosmic paths are browser origin-local: export from an older origin before changing hosts.
