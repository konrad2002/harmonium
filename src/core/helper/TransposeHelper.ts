import type {ComposeNote} from "../model/ComposeNote.ts";
import type {HarmoniumTone} from "../model/HarmoniumTone.ts";
import {baseToneName} from "../data/KeyboardMapping.ts";
import {KEY_COLOURS} from "../data/ManualLayout.ts";

// A tone's octave: its base cents (0 to 1200) plus 1200 per octave shift (see resolveRegisterTone)
const toneOctave = (tone: HarmoniumTone) => Math.floor(tone.cent / 1200);

export interface TransposeResult {
    notes: ComposeNote[];
    // Notes for which no key plays the tone in the target octave
    removed: number;
}

/**
 * Moves every note by whole octaves: each note goes to the key of the same colour that plays the
 * same tone name in the octave above or below. Notes without such a key are removed; notes on
 * keys without a tone (no register pulled) cannot be moved and stay as they are.
 */
export function transposeNotes(notes: ComposeNote[], octaves: number, keyTones: (HarmoniumTone | null)[]): TransposeResult {
    const keyOf = new Map<string, number>();
    keyTones.forEach((tone, key) => {
        if (tone) keyOf.set(`${KEY_COLOURS[key]}|${baseToneName(tone.name)}|${toneOctave(tone)}`, key);
    });

    const result: ComposeNote[] = [];
    let removed = 0;

    for (const note of notes) {
        const tone = keyTones[note.key];
        if (!tone) {
            result.push(note);
            continue;
        }

        const key = keyOf.get(`${KEY_COLOURS[note.key]}|${baseToneName(tone.name)}|${toneOctave(tone) + octaves}`);
        if (key === undefined) removed++;
        else result.push({...note, key});
    }

    return {notes: result, removed};
}
