import type {HarmoniumTone} from "../model/HarmoniumTone.ts";
import {KEY_COLOURS} from "./ManualLayout.ts";
import type {KeyColour} from "./RegisterConfiguration.ts";

/**
 * Playing the manual with the computer keyboard. Each laptop key (by `KeyboardEvent.code`) is
 * assigned a slot: a manual key described relative to the selected octave, so that shifting the
 * octave moves everything at once.
 */
export interface KeySlot {
    colour: KeyColour;
    // Semitones above the start of the selected octave (0 to 12 * OCTAVE_WINDOW - 1)
    semitone: number;
    // Base name of the assigned tone (without octave marks); tells apart tones of the same
    // semitone, e.g. gis° and as°
    tone?: string;
}

export type KeyboardMapping = Record<string, KeySlot>;

export interface KeyboardSetup {
    octave: number;
    mapping: KeyboardMapping;
}

export const MIN_OCTAVE = 0;
// The keys end in octave 5 (two or so tones), so higher octaves would be silent
export const MAX_OCTAVE = 4;
// Octave 2 starts at middle C (c° = MIDI 60)
export const DEFAULT_OCTAVE = 2;
// Slots can reach this many octaves above the selected one
export const OCTAVE_WINDOW = 3;

const COLOURS: KeyColour[] = ["red", "white", "blue", "yellow"];

/** Tone name without the octave marks (') the manual adds. */
export function baseToneName(name: string): string {
    return name.replace(/'+$/, "");
}

/** Semitones above the lowest c° (the tuning's reference tone) that a tone sounds at. */
export function toneSemitone(tone: HarmoniumTone): number {
    return Math.round(tone.cent / 100);
}

/**
 * The manual key a slot refers to in the given octave, or null if the colour has no such tone.
 * Several tones can share a semitone; the slot's own tone wins, otherwise the one closest to it.
 */
export function resolveSlot(slot: KeySlot, octave: number, keyTones: (HarmoniumTone | null)[]): number | null {
    const target = octave * 12 + slot.semitone;
    let best: number | null = null;
    let bestScore = Infinity;

    for (let key = 0; key < keyTones.length; key++) {
        const tone = keyTones[key];
        if (!tone || KEY_COLOURS[key] !== slot.colour || toneSemitone(tone) !== target) continue;

        const score = baseToneName(tone.name) === slot.tone ? -1 : Math.abs(tone.cent - target * 100);
        if (score < bestScore) {
            best = key;
            bestScore = score;
        }
    }

    return best;
}

/** The slot that describes a manual key in the given octave, or null if it is out of reach. */
export function slotForKey(key: number, octave: number, keyTones: (HarmoniumTone | null)[]): KeySlot | null {
    const tone = keyTones[key];
    if (!tone) return null;

    const semitone = toneSemitone(tone) - octave * 12;
    if (semitone < 0 || semitone >= 12 * OCTAVE_WINDOW) return null;

    return {colour: KEY_COLOURS[key], semitone, tone: baseToneName(tone.name)};
}

// Classic piano layout: the lower row holds the white keys, the row above the black keys; the
// upper two rows repeat it one octave higher. Pairs of [KeyboardEvent.code, semitone].
const PIANO_LAYOUT: [string, number][] = [
    ["KeyZ", 0], ["KeyS", 1], ["KeyX", 2], ["KeyD", 3], ["KeyC", 4], ["KeyV", 5],
    ["KeyG", 6], ["KeyB", 7], ["KeyH", 8], ["KeyN", 9], ["KeyJ", 10], ["KeyM", 11],
    ["KeyQ", 12], ["Digit2", 13], ["KeyW", 14], ["Digit3", 15], ["KeyE", 16], ["KeyR", 17],
    ["Digit5", 18], ["KeyT", 19], ["Digit6", 20], ["KeyY", 21], ["Digit7", 22], ["KeyU", 23],
    ["KeyI", 24], ["Digit9", 25], ["KeyO", 26], ["Digit0", 27], ["KeyP", 28],
];

/** Piano layout playing the keys of one colour. */
export function pianoMapping(colour: KeyColour): KeyboardMapping {
    return Object.fromEntries(PIANO_LAYOUT.map(([code, semitone]) => [code, {colour, semitone}]));
}

export function defaultSetup(): KeyboardSetup {
    return {octave: DEFAULT_OCTAVE, mapping: pianoMapping("yellow")};
}

/** Validates stored JSON; returns null unless it is a complete, valid setup. */
export function parseStoredSetup(raw: unknown): KeyboardSetup | null {
    if (typeof raw !== "object" || raw === null) return null;
    const {octave, mapping} = raw as Record<string, unknown>;

    if (typeof octave !== "number" || !Number.isInteger(octave) || octave < MIN_OCTAVE || octave > MAX_OCTAVE) return null;
    if (typeof mapping !== "object" || mapping === null || Array.isArray(mapping)) return null;

    const result: KeyboardMapping = {};
    for (const [code, value] of Object.entries(mapping)) {
        if (typeof value !== "object" || value === null) return null;
        const {colour, semitone, tone} = value as Record<string, unknown>;

        if (!COLOURS.includes(colour as KeyColour)) return null;
        if (typeof semitone !== "number" || !Number.isInteger(semitone) || semitone < 0 || semitone >= 12 * OCTAVE_WINDOW) return null;
        if (tone !== undefined && typeof tone !== "string") return null;

        result[code] = tone === undefined ? {colour: colour as KeyColour, semitone} : {colour: colour as KeyColour, semitone, tone};
    }

    return {octave, mapping: result};
}
