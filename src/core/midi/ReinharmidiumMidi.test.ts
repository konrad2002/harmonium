import {describe, it, expect} from "vitest";
import type {ComposeNote} from "../model/ComposeNote.ts";
import {
    centsToNote,
    exportComposition,
    findNearestKey,
    importComposition,
    pitchBendCents,
    pitchBendValue,
    REFERENCE_NOTE,
} from "./ReinharmidiumMidi.ts";
import {parseMidiFile, writeMidiFile, type MidiEvent} from "./MidiFile.ts";

// Pitch in cents of a few keys: c°, c+1, e-1, e°, c° two octaves up, des+1, his-2 (a high one)
const KEY_CENTS: (number | null)[] = [0, 21.6, 386.4, 408, 2400, 111.6, null, 1180.8];

function note(id: string, key: number, start: number, duration: number): ComposeNote {
    return {id, key, start, duration};
}

describe("pitch bend", () => {
    it("centres at 8192 and follows the specified formula", () => {
        expect(pitchBendValue(0)).toBe(8192);
        expect(pitchBendValue(200)).toBe(16383);
        expect(pitchBendValue(-200)).toBe(1);
        expect(pitchBendValue(1000)).toBe(16383);
        expect(pitchBendValue(-1000)).toBe(0);
    });

    it("gives the values of the specification's syntonic comma examples", () => {
        expect(pitchBendValue(21.51)).toBe(9073);
        expect(pitchBendValue(-21.51)).toBe(7311);
    });

    it("converts back to cents", () => {
        expect(pitchBendCents(8192)).toBe(0);
        expect(pitchBendCents(pitchBendValue(-13.6))).toBeCloseTo(-13.6, 1);
        expect(pitchBendCents(pitchBendValue(37.25))).toBeCloseTo(37.25, 1);
    });
});

describe("centsToNote", () => {
    it("uses the nearest semitone as base note and the rest as bend", () => {
        expect(centsToNote(0)).toEqual({note: REFERENCE_NOTE, bendCents: 0});

        const e = centsToNote(386.4);
        expect(e.note).toBe(REFERENCE_NOTE + 4);
        expect(e.bendCents).toBeCloseTo(-13.6);

        const his = centsToNote(1180.8);
        expect(his.note).toBe(REFERENCE_NOTE + 12);
        expect(his.bendCents).toBeCloseTo(-19.2);
    });
});

describe("findNearestKey", () => {
    it("picks the closest tone, the lowest key for equal pitches", () => {
        expect(findNearestKey(390, KEY_CENTS)).toBe(2);
        expect(findNearestKey(404, KEY_CENTS)).toBe(3);
        expect(findNearestKey(0, [5, 0, 0])).toBe(1);
    });

    it("ignores unassigned keys and gives up when nothing is close", () => {
        expect(findNearestKey(1500, KEY_CENTS)).toBeNull();
        expect(findNearestKey(0, [null, null])).toBeNull();
    });
});

describe("exportComposition", () => {
    it("sends the pitch bend before the note on, on a channel of its own", () => {
        const {bytes, exported} = exportComposition([note("a", 2, 0.5, 0.25), note("b", 3, 0.5, 0.25)], KEY_CENTS);
        expect(exported).toBe(2);

        const events = parseMidiFile(bytes).tracks[1].filter(e => e.message.kind !== "controlChange");
        const kinds = events.map(e => e.message.kind);
        expect(kinds).toEqual(["pitchBend", "pitchBend", "noteOn", "noteOn", "noteOff", "noteOff"]);

        const [bendA, bendB, onA, onB] = events.map(e => e.message);
        expect(bendA).toMatchObject({kind: "pitchBend", channel: 0});
        expect(onA).toMatchObject({kind: "noteOn", channel: 0, note: REFERENCE_NOTE + 4, velocity: 64});
        expect(bendB).toMatchObject({kind: "pitchBend", channel: 1});
        expect(onB).toMatchObject({kind: "noteOn", channel: 1, note: REFERENCE_NOTE + 4});
        expect(events[0].tick).toBe(480);
        expect(events[4].tick).toBe(720);
    });

    it("writes the bytes of a centred note exactly as specified", () => {
        const {bytes} = exportComposition([note("a", 0, 0, 1)], KEY_CENTS);
        const data = Array.from(bytes);
        // Pitch bend, delta time 0, note on
        const pattern = [0xe0, 0x00, 0x40, 0x00, 0x90, REFERENCE_NOTE, 0x40];
        const found = data.findIndex((_, i) => pattern.every((byte, offset) => data[i + offset] === byte));
        expect(found).toBeGreaterThan(-1);
    });

    it("announces the +-2 semitone bend range on the used channels", () => {
        const {bytes} = exportComposition([note("a", 0, 0, 1)], KEY_CENTS);
        const controls = parseMidiFile(bytes).tracks[1].filter(e => e.message.kind === "controlChange");
        expect(controls).toHaveLength(0); // controllers are skipped by the reader...
        const data = Array.from(bytes);
        // ...but are in the file: RPN 0 followed by data entry 2
        const rpn = [0xb0, 101, 0, 0x00, 0xb0, 100, 0, 0x00, 0xb0, 6, 2];
        expect(data.findIndex((_, i) => rpn.every((byte, offset) => data[i + offset] === byte))).toBeGreaterThan(-1);
    });

    it("reuses a channel once its note has ended, even in the same tick", () => {
        const notes = Array.from({length: 20}, (_, i) => note(`n${i}`, 0, i * 0.5, 0.5));
        const {bytes, skippedPolyphony} = exportComposition(notes, KEY_CENTS);
        expect(skippedPolyphony).toBe(0);

        const on = parseMidiFile(bytes).tracks[1].filter(e => e.message.kind === "noteOn");
        expect(on).toHaveLength(20);
    });

    it("skips unassigned keys and notes that need more than 16 channels", () => {
        const chord = Array.from({length: 17}, (_, i) => note(`c${i}`, 0, 0, 1));
        const result = exportComposition([...chord, note("u", 6, 5, 1)], KEY_CENTS);

        expect(result.exported).toBe(16);
        expect(result.skippedPolyphony).toBe(1);
        expect(result.skippedUnassigned).toBe(1);
    });

    it("skips notes beyond the MIDI note range", () => {
        const result = exportComposition([note("a", 0, 0, 1)], [REFERENCE_NOTE * 0 + 100 * 100]);
        expect(result.skippedOutOfRange).toBe(1);
        expect(result.exported).toBe(0);
    });
});

describe("importComposition", () => {
    it("restores an exported composition", () => {
        const original = [
            note("a", 0, 0, 0.5),
            note("b", 2, 0.125, 0.75),
            note("c", 3, 0.125, 0.75),
            note("d", 4, 1.5, 0.25),
            note("e", 7, 2, 1),
            note("f", 5, 2, 1),
        ];
        const {bytes} = exportComposition(original, KEY_CENTS);
        const {notes, skippedNoKey} = importComposition(bytes, KEY_CENTS);

        expect(skippedNoKey).toBe(0);
        expect(notes).toHaveLength(original.length);

        const sortKey = (n: ComposeNote) => `${n.start.toFixed(4)}-${n.key}`;
        const sorted = [...original].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
        notes.sort((a, b) => sortKey(a).localeCompare(sortKey(b))).forEach((imported, i) => {
            expect(imported.key).toBe(sorted[i].key);
            expect(imported.start).toBeCloseTo(sorted[i].start, 6);
            expect(imported.duration).toBeCloseTo(sorted[i].duration, 6);
        });
    });

    it("maps plain 12-TET notes without pitch bend to the closest tone", () => {
        const track: MidiEvent[] = [
            {tick: 0, message: {kind: "noteOn", channel: 0, note: REFERENCE_NOTE + 4, velocity: 100}},
            {tick: 480, message: {kind: "noteOff", channel: 0, note: REFERENCE_NOTE + 4, velocity: 0}},
            {tick: 480, message: {kind: "noteOn", channel: 0, note: REFERENCE_NOTE + 40, velocity: 100}},
            {tick: 960, message: {kind: "noteOff", channel: 0, note: REFERENCE_NOTE + 40, velocity: 0}},
        ];
        const {notes, skippedNoKey} = importComposition(writeMidiFile(480, [track]), KEY_CENTS);

        // 400 cents is 8 cents from e° and 14 from e-1
        expect(notes.map(n => n.key)).toEqual([3]);
        expect(skippedNoKey).toBe(1);
        // Default tempo: a quarter note is half a second
        expect(notes[0].duration).toBeCloseTo(0.5);
    });

    it("applies the pitch bend of the channel and follows tempo changes", () => {
        const track: MidiEvent[] = [
            {tick: 0, message: {kind: "tempo", microsecondsPerQuarter: 1000000}},
            {tick: 480, message: {kind: "tempo", microsecondsPerQuarter: 250000}},
            // Bend arrives in the same tick as the note on, but after it in the file
            {tick: 480, message: {kind: "noteOn", channel: 5, note: REFERENCE_NOTE + 4, velocity: 64}},
            {tick: 480, message: {kind: "pitchBend", channel: 5, value: pitchBendValue(-13.6)}},
            {tick: 960, message: {kind: "noteOff", channel: 5, note: REFERENCE_NOTE + 4, velocity: 0}},
        ];
        const {notes} = importComposition(writeMidiFile(480, [track]), KEY_CENTS);

        expect(notes).toHaveLength(1);
        expect(notes[0].key).toBe(2);
        expect(notes[0].start).toBeCloseTo(1);
        expect(notes[0].duration).toBeCloseTo(0.25);
    });

    it("ends notes without a note off at the end of the file", () => {
        const track: MidiEvent[] = [
            {tick: 0, message: {kind: "noteOn", channel: 0, note: REFERENCE_NOTE, velocity: 64}},
            {tick: 960, message: {kind: "noteOn", channel: 1, note: REFERENCE_NOTE, velocity: 64}},
        ];
        const {notes} = importComposition(writeMidiFile(480, [track]), KEY_CENTS);

        expect(notes).toHaveLength(2);
        expect(notes[0].duration).toBeCloseTo(1);
    });
});
