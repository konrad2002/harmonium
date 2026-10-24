import {describe, it, expect} from "vitest";
import tonesCsv from "../../../public/tones.csv?raw";
import registersJson from "../../../public/registers.json?raw";
import {parseCSV} from "../helper/CsvHelper.ts";
import {buildToneIndex, resolveRegisterTone, type Register} from "../data/RegisterConfiguration.ts";
import {KEY_COLOURS, KEY_COLOUR_POSITIONS} from "../data/ManualLayout.ts";
import {EXAMPLE_COMPOSITION} from "../data/ExampleComposition.ts";
import {centsToNote, exportComposition, importComposition} from "./ReinharmidiumMidi.ts";

// The real tuning and registers of the app, with the registers that are active by default
const toneIndex = buildToneIndex(parseCSV(tonesCsv, 42.8));
const registers = JSON.parse(registersJson) as Register[];

function keyCentsFor(active: (register: Register) => boolean): (number | null)[] {
    return KEY_COLOURS.map((colour, key) => {
        const register = registers.find(r => r.colour === colour && active(r));
        return resolveRegisterTone(register, KEY_COLOUR_POSITIONS[key], toneIndex)?.cent ?? null;
    });
}

describe("with the real tuning", () => {
    it("fits the keys of every register into the MIDI note range", () => {
        for (const register of registers.filter(r => r.tones.length > 0)) {
            const cents = keyCentsFor(r => r.id === register.id).filter((c): c is number => c !== null);
            expect(cents.length).toBeGreaterThan(0);

            for (const value of cents) {
                const {note, bendCents} = centsToNote(value);
                expect(note).toBeGreaterThanOrEqual(0);
                expect(note).toBeLessThanOrEqual(127);
                expect(Math.abs(bendCents)).toBeLessThanOrEqual(50);
            }
        }
    });

    it("restores the example composition with the default registers", () => {
        const keyCents = keyCentsFor(r => r.active);
        const {bytes, exported} = exportComposition(EXAMPLE_COMPOSITION, keyCents);
        expect(exported).toBe(EXAMPLE_COMPOSITION.length);

        const {notes, skippedNoKey} = importComposition(bytes, keyCents);
        expect(skippedNoKey).toBe(0);
        expect(notes).toHaveLength(EXAMPLE_COMPOSITION.length);

        // Different keys of equal pitch are interchangeable, so compare what is heard
        const heard = (list: {key: number; start: number; duration: number}[]) => list
            .map(n => `${n.start.toFixed(4)} ${n.duration.toFixed(4)} ${keyCents[n.key]?.toFixed(1)}`)
            .sort();
        expect(heard(notes)).toEqual(heard(EXAMPLE_COMPOSITION));
    });
});
