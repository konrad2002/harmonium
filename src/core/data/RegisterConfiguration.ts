import type {HarmoniumTone} from "../model/HarmoniumTone.ts";

export type KeyColour = "red" | "white" | "blue" | "yellow";

/**
 * Register configuration loaded from registers.json
 */
export interface Register {
    id: number;
    register: string; // Roman numeral (I, II, III, etc.)
    label: string; // Register name (2 GES, 2 ES, etc.)
    colour: KeyColour;
    /**
     * Ordered tone names (matching the "name" column of the tones CSV) played by this colour's
     * keys, for one octave, when this register is active. The k-th key of this colour plays
     * tones[k % tones.length], shifted up by Math.floor(k / tones.length) octaves.
     */
    tones: string[];
}

/**
 * Load registers from public/registers.json
 */
export async function loadRegisters(): Promise<Register[]> {
    try {
        const response = await fetch("/registers.json");
        if (!response.ok) {
            throw new Error(`Failed to load registers: ${response.statusText}`);
        }
        return response.json() as Promise<Register[]>;
    } catch (err) {
        console.error("Error loading registers:", err);
        return [];
    }
}

// The 4 key colours in the order they appear starting at key (i=0, j=0).
const KEY_COLOURS: KeyColour[] = ["white", "blue", "yellow", "red"];

/**
 * Colour of the key at manual row `i`, column `j`. Mirrors the physical colour pattern of the
 * harmonium manual (must stay in sync with the layout used to render the keys).
 */
export function getKeyColour(i: number, j: number): KeyColour {
    return KEY_COLOURS[((i % 3 === 0 ? 3 : 0) + j + 2 * i + Math.floor(i / 3)) % 4];
}

/**
 * Flat list of colours for every key of the manual, in the same left-to-right, row-by-row order
 * used when rendering the keys.
 */
export function getManualKeyColours(keyCount = 56): KeyColour[] {
    const colours: KeyColour[] = [];
    for (let i = 0; colours.length < keyCount; i++) {
        const rowSize = i % 3 === 0 ? 5 : 4;
        for (let j = 0; j < rowSize && colours.length < keyCount; j++) {
            colours.push(getKeyColour(i, j));
        }
    }
    return colours;
}

/**
 * For a flat list of key colours, returns the 0-based position of each key among keys sharing
 * the same colour (e.g. the 3rd yellow key gets position 2).
 */
export function computeKeyColourPositions(colours: KeyColour[]): number[] {
    const counters = new Map<KeyColour, number>();
    return colours.map(colour => {
        const position = counters.get(colour) ?? 0;
        counters.set(colour, position + 1);
        return position;
    });
}

/**
 * Builds a lookup from tone name (as in the tones CSV) to its base HarmoniumTone.
 */
export function buildToneIndex(tones: HarmoniumTone[]): Map<string, HarmoniumTone> {
    const index = new Map<string, HarmoniumTone>();
    for (const tone of tones) {
        index.set(tone.name, tone);
    }
    return index;
}

/**
 * Shifts a tone up by whole octaves (1200 cents / 1000 millioctave each), recomputing frequency
 * with the same linear cent-to-frequency mapping used elsewhere in the app.
 */
export function shiftToneByOctaves(tone: HarmoniumTone, octaves: number, baseFrequency: number): HarmoniumTone {
    if (octaves === 0) return tone;

    const cent = tone.cent + 1200 * octaves;
    return {
        name: tone.name,
        cent,
        millioctave: tone.millioctave + 1000 * octaves,
        frequency: baseFrequency + cent / 5,
    };
}

/**
 * Appends an octave marker (one apostrophe per octave) to a tone name shifted upward.
 */
export function formatToneNameWithOctave(name: string, octaves: number): string {
    return octaves > 0 ? name + "'".repeat(octaves) : name;
}

/**
 * Resolves the tone played by the `positionInColour`-th key of a colour when `register` is
 * active, wrapping around the register's tone list and shifting up by whole octaves each time it
 * wraps. Returns null when there's no active register, it has no tones configured, or one of its
 * tone names isn't found in `toneIndex`.
 */
export function resolveRegisterTone(
    register: Register | undefined,
    positionInColour: number,
    toneIndex: Map<string, HarmoniumTone>,
    baseFrequency: number
): HarmoniumTone | null {
    if (!register || register.tones.length === 0) return null;

    const toneCount = register.tones.length;
    const octaves = Math.floor(positionInColour / toneCount);
    const toneName = register.tones[positionInColour % toneCount];

    const baseTone = toneIndex.get(toneName);
    if (!baseTone) return null;

    const shifted = shiftToneByOctaves(baseTone, octaves, baseFrequency);
    return {...shifted, name: formatToneNameWithOctave(baseTone.name, octaves)};
}

