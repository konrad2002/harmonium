# Harmonium Implementation Plan

This plan breaks down building the full Harmonium web tool (see [PROJECT_DESCRIPTION.md](./PROJECT_DESCRIPTION.md)) into phases, based on a review of the existing key/manual implementation. Work through phases in order; each phase can be requested step by step.

## Current state (as reviewed)

- `src/components/KeyboardView/Keyboard/Keyboard.tsx` — static, non-interactive piano-style key view. Unfinished, not wired to sound.
- `src/components/ManualView/Manual/Manual.tsx` + `ManualKey`/`ManualKeySpacer` — the real harmonium button-manual layout, already wired to `tone.js` via `useSynth`/`useOscillator` hooks and tuned from `tones_min.csv` via `CsvHelper`.
- `src/App.tsx` — currently just stacks dev/test components (`SoundTester`, `TestComp`, duplicate `Keyboard`) with no real shell.
- `CsvHelper.parseCSV` has a bug: parsed tones never get a `frequency` field set; it's only computed later inline in `Manual.tsx`.
- No theme system (dark/light) yet; colors are hardcoded in SCSS modules.

## Phase 0 — Cleanup & groundwork

- Fix `CsvHelper.parseCSV` so `frequency` is derived and set for every parsed tone (move logic out of `Manual.tsx`).
- Remove dead/duplicate code from `App.tsx` (duplicate `Keyboard`, `SoundTester`, `TestComp`).
- Decide the single source of truth for tone data (`tones.csv` vs `tones_min.csv`) and confirm the octave range / key count (`Manual.tsx` hardcodes 56 keys).
- Introduce SCSS theme variables (light/dark) — a shared variables file replacing hardcoded colors in `ManualKey.module.scss`, `Keyboard.module.scss`, `index.scss`.

## Phase 1 — Solidify the playable instrument

- Decide fate of `Keyboard.tsx` (piano view): finish it as an alternate visualization, or drop it in favor of `Manual` (matches the real Eitz Harmonium button layout).
- Extract the duplicated `playToneFrequencySynth`/`stopToneFrequencySynth` logic out of `Manual.tsx` into a reusable hook (e.g. `useHarmoniumSynth`) shared by keyboard playing and future song playback.
- Add computer-keyboard input support for playing keys, plus robust mouse/touch handling (`onMouseLeave` while pressed, touch events for mobile).
- Add a visual "pressed" state on `ManualKey`.
- Add volume/gain control and optional voice/sound selection.

## Phase 2 — App shell & theming

- Build a real `App.tsx` layout: header/nav, dark/light theme toggle, view switcher (Play / Compose / Import-Export).
- Apply the Phase 0 SCSS theme variables across all components.

## Phase 3 — Pre-programmed piece playback

- Define an internal song/note-sequence data model (note, start time, duration, velocity), independent of MIDI.
- Add a "Player" component that schedules notes via `tone.js` `Transport`/`Part` and highlights `Manual` keys as they play, reusing the Phase 1 tone engine.
- Ship at least one example pre-programmed piece as a bundled asset.

## Phase 4 — Song builder / timeline (DAW-like)

- Build a timeline/piano-roll component: time axis, one lane per harmonium tone, click-drag to place/resize/delete notes.
- Add transport controls (play, pause, stop, loop, tempo/BPM, zoom).
- Wire the timeline data model to the Phase 3 playback engine; support live recording of played keys into the timeline.
- Add persistence (local storage or downloadable project file).

## Phase 5 — MIDI import/export

- Add a MIDI parser/writer (e.g. `@tonejs/midi`) to convert between the internal song model and `.mid` files.
- Add "Import MIDI" (file → populate timeline) and "Export MIDI" (timeline → download `.mid`), with a pitch mapping between 12-TET MIDI notes and harmonium tone names/cents (the harmonium isn't 12-TET).

## Suggested order

Phase 0 → 1 → 2 → 3 → 4 → 5. Phase 2 (shell/theming) can run in parallel with Phase 1 if visible progress is preferred earlier.
