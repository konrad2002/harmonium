import {describe, it, expect} from "vitest";
import type {HarmoniumTone} from "../model/HarmoniumTone.ts";
import type {ComposeNote} from "../model/ComposeNote.ts";
import {KEY_COLOURS, KEY_COUNT} from "../data/ManualLayout.ts";
import {transposeNotes} from "./TransposeHelper.ts";

function tone(name: string, cent: number): HarmoniumTone {
    return {name, cent, millioctave: 0, frequency: 100 + cent / 5};
}

const yellow = KEY_COLOURS.flatMap((c, i) => c === "yellow" ? [i] : []);
const red = KEY_COLOURS.flatMap((c, i) => c === "red" ? [i] : []);

// Yellow c° in octaves 1, 2 and 3 and d° in octave 2; red c° in octave 2
function keyTones(): (HarmoniumTone | null)[] {
    const tones: (HarmoniumTone | null)[] = Array(KEY_COUNT).fill(null);
    tones[yellow[0]] = tone("c°'", 1200);
    tones[yellow[1]] = tone("c°''", 2400);
    tones[yellow[2]] = tone("c°'''", 3600);
    tones[yellow[3]] = tone("d°''", 2604);
    tones[red[0]] = tone("c°''", 2400);
    return tones;
}

const note = (id: string, key: number): ComposeNote => ({id, key, start: 1, duration: 0.5});

describe("transposeNotes", () => {
    const tones = keyTones();

    it("moves notes to the same tone in the next octave, keeping their timing", () => {
        const {notes, removed} = transposeNotes([note("a", yellow[1])], 1, tones);
        expect(notes).toEqual([{id: "a", key: yellow[2], start: 1, duration: 0.5}]);
        expect(removed).toBe(0);
    });

    it("moves down as well", () => {
        expect(transposeNotes([note("a", yellow[1])], -1, tones).notes[0].key).toBe(yellow[0]);
    });

    it("removes notes that have no key in the target octave", () => {
        const result = transposeNotes([note("a", yellow[2]), note("b", yellow[3]), note("c", yellow[1])], 1, tones);
        expect(result.notes.map(n => n.id)).toEqual(["c"]);
        expect(result.removed).toBe(2);
    });

    it("keeps the colour of the key", () => {
        // Only yellow has a c° in octave 3
        expect(transposeNotes([note("a", red[0])], 1, tones)).toEqual({notes: [], removed: 1});
    });

    it("leaves notes on keys without a tone alone", () => {
        const unassigned = KEY_COLOURS.indexOf("blue");
        expect(transposeNotes([note("a", unassigned)], 1, tones)).toEqual({notes: [note("a", unassigned)], removed: 0});
    });

    it("moving up and back down restores the notes that stayed in range", () => {
        const original = [note("a", yellow[0]), note("b", yellow[1])];
        const up = transposeNotes(original, 1, tones).notes;
        expect(transposeNotes(up, -1, tones).notes).toEqual(original);
    });
});
