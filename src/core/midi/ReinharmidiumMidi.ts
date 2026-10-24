import type {ComposeNote} from "../model/ComposeNote.ts";
import {parseMidiFile, writeMidiFile, type MidiEvent, type MidiMessage} from "./MidiFile.ts";

/*
 * ReinharMIDIum encoding (see docs/reinharmidium_midi_data_format_specification.md): every sounding
 * note gets its own MIDI channel (MPE style). A channel pitch bend sent right before the Note On
 * tunes the note away from its 12-TET base note, with a bend range of +-200 cents.
 */

// Ticks per quarter note and tempo (120 bpm) of exported files: one second is 960 ticks, so the
// 0.125 s grid of the compose editor lands on whole ticks.
export const TICKS_PER_QUARTER = 480;
export const MICROSECONDS_PER_QUARTER = 500000;
export const TICKS_PER_SECOND = 960;

// MIDI note of a tone with 0 cents (the lowest "c°"). The keys span almost 6 octaves, so the
// spec's middle C (60) as reference would push the highest keys beyond MIDI note 127.
export const REFERENCE_NOTE = 36;

export const PITCH_BEND_RANGE_CENTS = 200;
export const PITCH_BEND_CENTER = 8192;
const PITCH_BEND_MAX = 16383;

const VELOCITY = 64;
const CHANNEL_COUNT = 16;

// Imported notes must be this close (in cents) to the tone of a key; a 12-TET note is at most
// about 25 cents away from the nearest tone of the harmonium tuning.
export const MAX_IMPORT_DISTANCE_CENTS = 30;

/** 14-bit pitch bend value for a deviation from the base note in cents. */
export function pitchBendValue(deltaCents: number): number {
    const value = Math.round(PITCH_BEND_CENTER + (deltaCents / PITCH_BEND_RANGE_CENTS) * 8191);
    return Math.min(Math.max(value, 0), PITCH_BEND_MAX);
}

/** Deviation in cents that a 14-bit pitch bend value stands for. */
export function pitchBendCents(value: number): number {
    return ((value - PITCH_BEND_CENTER) / 8191) * PITCH_BEND_RANGE_CENTS;
}

/** Nearest 12-TET note for a pitch given in cents above the reference tone, and the remaining bend. */
export function centsToNote(cents: number): {note: number; bendCents: number} {
    const note = REFERENCE_NOTE + Math.round(cents / 100);
    return {note, bendCents: cents - (note - REFERENCE_NOTE) * 100};
}

// Same tick: notes end first (freeing their channel), then pitch bends, then notes start.
const ORDER = {setup: 0, noteOff: 1, pitchBend: 2, noteOn: 3} as const;

type OrderedEvent = {order: number; event: MidiEvent};

export interface ExportResult {
    bytes: Uint8Array;
    exported: number;
    // Notes on keys that play no tone with the current registers
    skippedUnassigned: number;
    // Notes beyond MIDI's 128 note range
    skippedOutOfRange: number;
    // Notes that would need more than 16 simultaneous channels
    skippedPolyphony: number;
}

/**
 * Encodes a composition as a Standard MIDI File. `keyCents` holds, for every manual key, the
 * pitch in cents above the lowest c° of the tone it currently plays (null = unassigned).
 */
export function exportComposition(notes: ComposeNote[], keyCents: (number | null)[]): ExportResult {
    let skippedUnassigned = 0;
    let skippedOutOfRange = 0;
    let skippedPolyphony = 0;

    const candidates = [...notes].sort((a, b) => a.start - b.start || a.key - b.key);

    const channelFreeAt: number[] = Array(CHANNEL_COUNT).fill(-Infinity);
    const usedChannels = new Set<number>();
    let lastChannel = CHANNEL_COUNT - 1;
    const events: OrderedEvent[] = [];

    for (const note of candidates) {
        const cents = keyCents[note.key];
        if (cents === null || cents === undefined) {
            skippedUnassigned++;
            continue;
        }

        const {note: midiNote, bendCents} = centsToNote(cents);
        if (midiNote < 0 || midiNote > 127) {
            skippedOutOfRange++;
            continue;
        }

        const startTick = Math.round(note.start * TICKS_PER_SECOND);
        const endTick = Math.max(startTick + 1, Math.round((note.start + note.duration) * TICKS_PER_SECOND));

        // Rotate through the channels so that a channel is reused as late as possible
        let channel = -1;
        for (let step = 1; step <= CHANNEL_COUNT; step++) {
            const candidate = (lastChannel + step) % CHANNEL_COUNT;
            if (channelFreeAt[candidate] <= startTick) {
                channel = candidate;
                break;
            }
        }
        if (channel === -1) {
            skippedPolyphony++;
            continue;
        }

        channelFreeAt[channel] = endTick;
        lastChannel = channel;
        usedChannels.add(channel);

        events.push(
            {order: ORDER.pitchBend, event: {tick: startTick, message: {kind: "pitchBend", channel, value: pitchBendValue(bendCents)}}},
            {order: ORDER.noteOn, event: {tick: startTick, message: {kind: "noteOn", channel, note: midiNote, velocity: VELOCITY}}},
            {order: ORDER.noteOff, event: {tick: endTick, message: {kind: "noteOff", channel, note: midiNote, velocity: 0}}},
        );
    }

    // Tell receivers about the bend range: RPN 0 = +-2 semitones, then RPN null
    for (const channel of usedChannels) {
        const controllers: [number, number][] = [[101, 0], [100, 0], [6, 2], [38, 0], [101, 127], [100, 127]];
        for (const [controller, value] of controllers) {
            events.push({order: ORDER.setup, event: {tick: 0, message: {kind: "controlChange", channel, controller, value}}});
        }
    }

    events.sort((a, b) => a.event.tick - b.event.tick || a.order - b.order);

    const tempoTrack: MidiEvent[] = [
        {tick: 0, message: {kind: "trackName", text: "ReinharMIDIum"}},
        {tick: 0, message: {kind: "timeSignature", numerator: 4, denominatorPower: 2}},
        {tick: 0, message: {kind: "tempo", microsecondsPerQuarter: MICROSECONDS_PER_QUARTER}},
    ];

    const noteTrack: MidiEvent[] = [
        {tick: 0, message: {kind: "trackName", text: "Notes"}},
        ...events.map(item => item.event),
    ];

    const exported = candidates.length - skippedUnassigned - skippedOutOfRange - skippedPolyphony;

    return {
        bytes: writeMidiFile(TICKS_PER_QUARTER, [tempoTrack, noteTrack]),
        exported,
        skippedUnassigned,
        skippedOutOfRange,
        skippedPolyphony,
    };
}

export interface ImportResult {
    notes: ComposeNote[];
    // Notes without a key within MAX_IMPORT_DISTANCE_CENTS of their pitch (with the current registers)
    skippedNoKey: number;
}

type Tempo = {tick: number; microsecondsPerQuarter: number};

function ticksToSeconds(tick: number, tempos: Tempo[], division: number): number {
    let seconds = 0;
    let previousTick = 0;
    let microsecondsPerQuarter = 500000; // MIDI default: 120 bpm

    for (const tempo of tempos) {
        if (tempo.tick >= tick) break;
        seconds += ((tempo.tick - previousTick) * microsecondsPerQuarter) / 1e6 / division;
        previousTick = tempo.tick;
        microsecondsPerQuarter = tempo.microsecondsPerQuarter;
    }

    return seconds + ((tick - previousTick) * microsecondsPerQuarter) / 1e6 / division;
}

/** The key whose tone is closest to `cents`, or null if none is within the allowed distance. */
export function findNearestKey(cents: number, keyCents: (number | null)[]): number | null {
    let best: number | null = null;
    let bestDistance = Infinity;

    for (let key = 0; key < keyCents.length; key++) {
        const keyPitch = keyCents[key];
        if (keyPitch === null) continue;

        // Strictly closer only, so equal pitches resolve to the lowest key
        const distance = Math.abs(keyPitch - cents);
        if (distance < bestDistance) {
            best = key;
            bestDistance = distance;
        }
    }

    return bestDistance <= MAX_IMPORT_DISTANCE_CENTS ? best : null;
}

const IMPORT_ORDER = {noteOff: 0, pitchBend: 1, noteOn: 2} as const;

/**
 * Reads a Standard MIDI File into a composition: the pitch of each note (note number plus the
 * pitch bend of its channel) is assigned to the key that plays the closest tone.
 */
export function importComposition(bytes: Uint8Array, keyCents: (number | null)[]): ImportResult {
    const midi = parseMidiFile(bytes);

    const messages: {tick: number; order: number; message: MidiMessage}[] = [];
    const tempos: Tempo[] = [];

    for (const track of midi.tracks) {
        for (const {tick, message} of track) {
            if (message.kind === "tempo") {
                tempos.push({tick, microsecondsPerQuarter: message.microsecondsPerQuarter});
            } else if (message.kind === "noteOff" || message.kind === "pitchBend" || message.kind === "noteOn") {
                messages.push({tick, order: IMPORT_ORDER[message.kind], message});
            }
        }
    }
    tempos.sort((a, b) => a.tick - b.tick);
    messages.sort((a, b) => a.tick - b.tick || a.order - b.order);

    const bends: number[] = Array(CHANNEL_COUNT).fill(PITCH_BEND_CENTER);
    // Notes waiting for their note off, per channel and note number, oldest first
    const open = new Map<number, {startTick: number; cents: number}[]>();
    const finished: {startTick: number; endTick: number; cents: number}[] = [];

    for (const {tick, message} of messages) {
        if (message.kind === "pitchBend") {
            bends[message.channel] = message.value;
        } else if (message.kind === "noteOn") {
            const cents = (message.note - REFERENCE_NOTE) * 100 + pitchBendCents(bends[message.channel]);
            const id = message.channel * 128 + message.note;
            open.set(id, [...(open.get(id) ?? []), {startTick: tick, cents}]);
        } else if (message.kind === "noteOff") {
            const queue = open.get(message.channel * 128 + message.note);
            const started = queue?.shift();
            if (started) finished.push({...started, endTick: tick});
        }
    }

    // Notes that never got a note off last until the end of the file
    const lastTick = messages.reduce((max, item) => Math.max(max, item.tick), 0);
    for (const queue of open.values()) {
        for (const started of queue) finished.push({...started, endTick: lastTick});
    }

    let skippedNoKey = 0;
    const notes: ComposeNote[] = [];

    finished.sort((a, b) => a.startTick - b.startTick);
    for (const {startTick, endTick, cents} of finished) {
        const key = findNearestKey(cents, keyCents);
        if (key === null) {
            skippedNoKey++;
            continue;
        }

        const start = ticksToSeconds(startTick, tempos, midi.division);
        const end = ticksToSeconds(endTick, tempos, midi.division);
        notes.push({id: `midi-${notes.length}`, key, start, duration: Math.max(end - start, 0.01)});
    }

    return {notes, skippedNoKey};
}
