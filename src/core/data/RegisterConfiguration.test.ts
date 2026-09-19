import {describe, it, expect} from "vitest";
import type {HarmoniumTone} from "../model/HarmoniumTone.ts";
import type {Register} from "./RegisterConfiguration.ts";
import {
    getKeyColour,
    getManualKeyColours,
    computeKeyColourPositions,
    buildToneIndex,
    shiftToneByOctaves,
    formatToneNameWithOctave,
    resolveRegisterTone,
} from "./RegisterConfiguration.ts";

const BASE_FREQUENCY = 261.63;

function makeTone(name: string, cent: number): HarmoniumTone {
    return {name, cent, millioctave: cent / 1.2, frequency: BASE_FREQUENCY + cent / 5};
}

function makeRegister(overrides: Partial<Register> = {}): Register {
    return {
        id: 1,
        register: "I",
        label: "Test",
        colour: "yellow",
        tones: [],
        ...overrides,
    };
}

describe("getManualKeyColours", () => {
    it("returns 56 colours by default", () => {
        expect(getManualKeyColours()).toHaveLength(56);
    });

    it("matches getKeyColour for every row/column", () => {
        const colours = getManualKeyColours();
        let index = 0;
        for (let i = 0; index < colours.length; i++) {
            const rowSize = i % 3 === 0 ? 5 : 4;
            for (let j = 0; j < rowSize && index < colours.length; j++, index++) {
                expect(colours[index]).toBe(getKeyColour(i, j));
            }
        }
    });

    it("respects a custom key count", () => {
        expect(getManualKeyColours(10)).toHaveLength(10);
    });
});

describe("computeKeyColourPositions", () => {
    it("assigns sequential 0-based positions per colour", () => {
        const colours = ["red", "red", "yellow", "red", "yellow"] as const;
        expect(computeKeyColourPositions([...colours])).toEqual([0, 1, 0, 2, 1]);
    });

    it("matches the counts of colours in the real manual layout", () => {
        const colours = getManualKeyColours();
        const positions = computeKeyColourPositions(colours);

        const maxPositionPerColour = new Map<string, number>();
        colours.forEach((colour, i) => {
            const current = maxPositionPerColour.get(colour) ?? -1;
            maxPositionPerColour.set(colour, Math.max(current, positions[i]));
        });

        // 56 keys split across 4 colours in this layout - every colour appears multiple times.
        for (const maxPosition of maxPositionPerColour.values()) {
            expect(maxPosition).toBeGreaterThan(0);
        }
    });
});

describe("buildToneIndex", () => {
    it("indexes tones by their name", () => {
        const tones = [makeTone("c°", 0), makeTone("d°", 204)];
        const index = buildToneIndex(tones);

        expect(index.get("c°")).toEqual(tones[0]);
        expect(index.get("d°")).toEqual(tones[1]);
        expect(index.get("missing")).toBeUndefined();
    });
});

describe("shiftToneByOctaves", () => {
    it("returns the same tone unchanged for zero octaves", () => {
        const tone = makeTone("c°", 0);
        expect(shiftToneByOctaves(tone, 0, BASE_FREQUENCY)).toBe(tone);
    });

    it("adds 1200 cents and 1000 millioctave per octave, recomputing frequency", () => {
        const tone = makeTone("c°", 0);
        const shifted = shiftToneByOctaves(tone, 1, BASE_FREQUENCY);

        expect(shifted.cent).toBe(1200);
        expect(shifted.millioctave).toBe(1000);
        expect(shifted.frequency).toBeCloseTo(BASE_FREQUENCY + 1200 / 5);
    });

    it("supports shifting by multiple octaves", () => {
        const tone = makeTone("d°", 204);
        const shifted = shiftToneByOctaves(tone, 2, BASE_FREQUENCY);

        expect(shifted.cent).toBe(204 + 2400);
        expect(shifted.millioctave).toBeCloseTo(204 / 1.2 + 2000);
    });
});

describe("formatToneNameWithOctave", () => {
    it("leaves the name untouched for zero octaves", () => {
        expect(formatToneNameWithOctave("c°", 0)).toBe("c°");
    });

    it("appends one apostrophe per octave shifted up", () => {
        expect(formatToneNameWithOctave("c°", 1)).toBe("c°'");
        expect(formatToneNameWithOctave("c°", 3)).toBe("c°'''");
    });
});

describe("resolveRegisterTone", () => {
    const tones = Array.from({length: 15}, (_, i) => makeTone(`tone-${i}`, i * 80));
    const toneIndex = buildToneIndex(tones);

    it("returns null when there is no active register", () => {
        expect(resolveRegisterTone(undefined, 0, toneIndex, BASE_FREQUENCY)).toBeNull();
    });

    it("returns null when the register has no tones configured", () => {
        const register = makeRegister({tones: []});
        expect(resolveRegisterTone(register, 0, toneIndex, BASE_FREQUENCY)).toBeNull();
    });

    it("returns null when a referenced tone name isn't found", () => {
        const register = makeRegister({tones: ["does-not-exist"]});
        expect(resolveRegisterTone(register, 0, toneIndex, BASE_FREQUENCY)).toBeNull();
    });

    it("picks the tone at position % tones.length with no octave shift within the first cycle", () => {
        const register = makeRegister({tones: tones.map(t => t.name)});
        const resolved = resolveRegisterTone(register, 1, toneIndex, BASE_FREQUENCY);

        expect(resolved?.name).toBe("tone-1");
        expect(resolved?.cent).toBe(tones[1].cent);
    });

    it("wraps around and shifts up an octave for the worked example (15 tones, 17th key)", () => {
        // 17th key (1-indexed) -> 0-indexed position 16; 16 % 15 === 1, 1 octave up.
        const register = makeRegister({tones: tones.map(t => t.name)});
        const positionInColour = 16;

        const resolved = resolveRegisterTone(register, positionInColour, toneIndex, BASE_FREQUENCY);

        expect(resolved?.name).toBe("tone-1'");
        expect(resolved?.cent).toBe(tones[1].cent + 1200);
        expect(resolved?.frequency).toBeCloseTo(BASE_FREQUENCY + (tones[1].cent + 1200) / 5);
    });

    it("shifts up multiple octaves after multiple wraps", () => {
        const register = makeRegister({tones: tones.map(t => t.name)});
        // position 31 -> 31 % 15 = 1, floor(31/15) = 2 octaves up.
        const resolved = resolveRegisterTone(register, 31, toneIndex, BASE_FREQUENCY);

        expect(resolved?.name).toBe("tone-1''");
        expect(resolved?.cent).toBe(tones[1].cent + 2400);
    });
});
