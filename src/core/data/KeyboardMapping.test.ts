import {describe, it, expect} from "vitest";
import type {HarmoniumTone} from "../model/HarmoniumTone.ts";
import {KEY_COLOURS, KEY_COUNT} from "./ManualLayout.ts";
import {
    OCTAVE_WINDOW,
    baseToneName,
    defaultSetup,
    parseStoredSetup,
    pianoMapping,
    resolveSlot,
    slotForKey,
} from "./KeyboardMapping.ts";

function tone(name: string, cent: number): HarmoniumTone {
    return {name, cent, millioctave: 0, frequency: 100 + cent / 5};
}

const yellow = KEY_COLOURS.flatMap((c, i) => c === "yellow" ? [i] : []);
const red = KEY_COLOURS.flatMap((c, i) => c === "red" ? [i] : []);

// Yellow keys: c° and cis° in octave 2 (2400 cents), gis° and as° in octave 2, c° in octave 3
function keyTones(): (HarmoniumTone | null)[] {
    const tones: (HarmoniumTone | null)[] = Array(KEY_COUNT).fill(null);
    tones[yellow[0]] = tone("c°''", 2400);
    tones[yellow[1]] = tone("cis°''", 2514);
    tones[yellow[2]] = tone("gis°''", 3216);
    tones[yellow[3]] = tone("as°''", 3192);
    tones[yellow[4]] = tone("c°'''", 3600);
    tones[red[0]] = tone("c-1''", 2378.4);
    return tones;
}

describe("baseToneName", () => {
    it("removes the octave marks only", () => {
        expect(baseToneName("c°''")).toBe("c°");
        expect(baseToneName("es+1")).toBe("es+1");
    });
});

describe("resolveSlot", () => {
    const tones = keyTones();

    it("finds the key of the colour at the semitone of the selected octave", () => {
        expect(resolveSlot({colour: "yellow", semitone: 0}, 2, tones)).toBe(yellow[0]);
        expect(resolveSlot({colour: "yellow", semitone: 1}, 2, tones)).toBe(yellow[1]);
        // The same slot one octave up
        expect(resolveSlot({colour: "yellow", semitone: 0}, 3, tones)).toBe(yellow[4]);
        expect(resolveSlot({colour: "yellow", semitone: 12}, 2, tones)).toBe(yellow[4]);
    });

    it("uses the colour of the slot, and rounds the tone to its semitone", () => {
        // c-1 sounds 21.6 cents below the next c, i.e. at semitone 24
        expect(resolveSlot({colour: "red", semitone: 0}, 2, tones)).toBe(red[0]);
        expect(resolveSlot({colour: "blue", semitone: 0}, 2, tones)).toBeNull();
    });

    it("prefers the named tone, otherwise the tone closest to the semitone", () => {
        expect(resolveSlot({colour: "yellow", semitone: 8}, 2, tones)).toBe(yellow[3]);
        expect(resolveSlot({colour: "yellow", semitone: 8, tone: "gis°"}, 2, tones)).toBe(yellow[2]);
        expect(resolveSlot({colour: "yellow", semitone: 8, tone: "as°"}, 2, tones)).toBe(yellow[3]);
    });

    it("returns null where the octave has no such key", () => {
        expect(resolveSlot({colour: "yellow", semitone: 0}, 0, tones)).toBeNull();
    });
});

describe("slotForKey", () => {
    const tones = keyTones();

    it("describes a key relative to the octave", () => {
        expect(slotForKey(yellow[0], 2, tones)).toEqual({colour: "yellow", semitone: 0, tone: "c°"});
        expect(slotForKey(yellow[4], 2, tones)).toEqual({colour: "yellow", semitone: 12, tone: "c°"});
        expect(slotForKey(yellow[0], 1, tones)).toEqual({colour: "yellow", semitone: 12, tone: "c°"});
    });

    it("is null for unassigned keys and keys out of reach", () => {
        expect(slotForKey(KEY_COLOURS.indexOf("blue"), 2, tones)).toBeNull();
        expect(slotForKey(yellow[0], 3, tones)).toBeNull();
        expect(slotForKey(yellow[4], 0, tones)).toBeNull();
        expect(slotForKey(yellow[4], 1 - OCTAVE_WINDOW, tones)).toBeNull();
    });

    it("round trips through resolveSlot", () => {
        const slot = slotForKey(yellow[2], 1, tones);
        expect(slot && resolveSlot(slot, 1, tones)).toBe(yellow[2]);
    });
});

describe("pianoMapping", () => {
    it("maps the lower row to one octave and uses every code once", () => {
        const mapping = pianoMapping("blue");
        expect(mapping.KeyZ).toEqual({colour: "blue", semitone: 0});
        expect(mapping.KeyM).toEqual({colour: "blue", semitone: 11});
        expect(mapping.KeyQ.semitone).toBe(12);

        const semitones = Object.values(mapping).map(slot => slot.semitone);
        expect(new Set(semitones).size).toBe(semitones.length);
        expect(Math.max(...semitones)).toBeLessThan(12 * OCTAVE_WINDOW);
    });
});

describe("parseStoredSetup", () => {
    it("accepts the default setup", () => {
        expect(parseStoredSetup(JSON.parse(JSON.stringify(defaultSetup())))).toEqual(defaultSetup());
    });

    it("rejects invalid data", () => {
        const valid = defaultSetup();
        expect(parseStoredSetup(null)).toBeNull();
        expect(parseStoredSetup({...valid, octave: 9})).toBeNull();
        expect(parseStoredSetup({...valid, octave: 1.5})).toBeNull();
        expect(parseStoredSetup({...valid, mapping: []})).toBeNull();
        expect(parseStoredSetup({...valid, mapping: {KeyA: {colour: "green", semitone: 0}}})).toBeNull();
        expect(parseStoredSetup({...valid, mapping: {KeyA: {colour: "red", semitone: 36}}})).toBeNull();
        expect(parseStoredSetup({...valid, mapping: {KeyA: {colour: "red", semitone: 0, tone: 3}}})).toBeNull();
    });
});
