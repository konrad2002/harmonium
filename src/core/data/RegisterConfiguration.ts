import type {HarmoniumTone} from "../model/HarmoniumTone.ts";

/**
 * Register configuration loaded from registers.json
 */
export interface Register {
    id: number;
    register: string; // Roman numeral (I, II, III, etc.)
    label: string; // Register name (2 GES, 2 ES, etc.)
    colour: "red" | "white" | "blue" | "yellow";
}

/**
 * Mapping of which tone each key produces for each register
 * keyIndex -> registerId -> frequency
 * 
 * This determines which frequency is played when:
 * - A key at keyIndex is pressed
 * - Register with registerId is selected
 */
export type RegisterToneMapping = Record<number, Record<number, number>>;

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

/**
 * Generate dummy register tone mapping
 * 
 * This maps each key index (0-55) to each register (1-8) to produce a specific frequency.
 * In the real instrument, different registers activate different reeds/tones for each key.
 * 
 * For now, this is a placeholder that should be replaced with actual register data.
 */
export function generateDummyRegisterToneMapping(tones: HarmoniumTone[]): RegisterToneMapping {
    const mapping: RegisterToneMapping = {};

    // Create a mapping for 56 keys (matching the manual layout)
    for (let keyIndex = 0; keyIndex < 56; keyIndex++) {
        mapping[keyIndex] = {};

        // For each register, map to a different tone
        // This is dummy data - replace with actual register-specific tone assignments
        for (let registerId = 1; registerId <= 8; registerId++) {
            // Use a simple algorithm: for each register and key, pick a tone
            // In reality, this would be based on the actual harmonium's register configuration
            const toneIndex = (keyIndex + (registerId - 1) * 7) % tones.length;
            mapping[keyIndex][registerId] = tones[toneIndex].frequency;
        }
    }

    return mapping;
}

/**
 * Get the frequency for a specific key and register combination
 */
export function getFrequencyForKeyAndRegister(
    keyIndex: number,
    activeRegisters: Map<string, number>, // color -> registerId
    registerToneMapping: RegisterToneMapping
): number | null {
    // Determine which register applies to this key based on the key color
    const keyColors = getKeyColorsForAllKeys();
    const keyColor = keyColors[keyIndex];

    if (!keyColor) return null;

    const registerId = activeRegisters.get(keyColor);
    if (!registerId) return null;

    const frequency = registerToneMapping[keyIndex]?.[registerId];
    return frequency || null;
}

/**
 * Get the color for each key in the manual layout
 * Returns array of 56 colors matching the manual key layout
 */
export function getKeyColorsForAllKeys(): string[] {
    const colors: string[] = [];

    // This mirrors the manual layout logic from Manual.tsx
    // For each of the 56 keys, determine the color based on the pattern
    let n = -1;
    for (let i = 0; i < 56; i++) {
        const numKeysInRow = i % 3 === 0 ? 5 : 4;

        for (let j = 0; j < numKeysInRow; j++) {
            n++;
            const color = getKeyColor(i, j);
            colors.push(color);
        }
    }

    return colors;
}

/**
 * Get the color for a key at row i, column j
 */
function getKeyColor(i: number, j: number): string {
    const colorArray = ["white", "blue", "yellow", "red"];
    return colorArray[((i % 3 === 0 ? 3 : 0) + j + 2 * i + (Math.floor(i / 3) * 3)) % 4];
}
