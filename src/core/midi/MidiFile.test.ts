import {describe, it, expect} from "vitest";
import {MidiFormatError, parseMidiFile, writeMidiFile, type MidiEvent} from "./MidiFile.ts";

describe("MidiFile", () => {
    it("writes a valid header and reads its own output back", () => {
        const track: MidiEvent[] = [
            {tick: 0, message: {kind: "tempo", microsecondsPerQuarter: 600000}},
            {tick: 0, message: {kind: "pitchBend", channel: 3, value: 7311}},
            {tick: 0, message: {kind: "noteOn", channel: 3, note: 64, velocity: 64}},
            // Needs a multi byte delta time
            {tick: 100000, message: {kind: "noteOff", channel: 3, note: 64, velocity: 0}},
        ];
        const bytes = writeMidiFile(480, [track]);

        expect(Array.from(bytes.slice(0, 4))).toEqual([0x4d, 0x54, 0x68, 0x64]);

        const parsed = parseMidiFile(bytes);
        expect(parsed.division).toBe(480);
        expect(parsed.tracks).toHaveLength(1);
        expect(parsed.tracks[0]).toEqual(track);
    });

    it("encodes pitch bend as LSB then MSB", () => {
        const bytes = writeMidiFile(480, [[{tick: 0, message: {kind: "pitchBend", channel: 0, value: 9073}}]]);
        const text = Array.from(bytes);
        // Skip the header, whose division (480 = 0x01E0) contains the byte 0xE0 too
        const at = text.indexOf(0xe0, 14);
        expect(text.slice(at, at + 3)).toEqual([0xe0, 0x71, 0x46]);
    });

    it("treats a note on with velocity 0 as note off and supports running status", () => {
        // Format 0, one track: note on (status), note on again (running status), then velocity 0
        const body = [0x00, 0x90, 60, 64, 0x10, 62, 64, 0x10, 60, 0, 0x00, 0xff, 0x2f, 0x00];
        const bytes = Uint8Array.from([
            0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0x01, 0xe0,
            0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, body.length, ...body,
        ]);

        const [track] = parseMidiFile(bytes).tracks;
        expect(track.map(e => [e.tick, e.message.kind])).toEqual([[0, "noteOn"], [16, "noteOn"], [32, "noteOff"]]);
    });

    it("rejects files that are not MIDI", () => {
        expect(() => parseMidiFile(new TextEncoder().encode("hello, this is not a MIDI file"))).toThrow(MidiFormatError);
        expect(() => parseMidiFile(new Uint8Array())).toThrow(MidiFormatError);
    });

    it("rejects truncated files", () => {
        const bytes = writeMidiFile(480, [[{tick: 0, message: {kind: "noteOn", channel: 0, note: 60, velocity: 64}}]]);
        expect(() => parseMidiFile(bytes.slice(0, bytes.length - 6))).toThrow(MidiFormatError);
    });
});
