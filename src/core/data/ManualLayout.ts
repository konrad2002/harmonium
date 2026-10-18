import {computeKeyColourPositions, getManualKeyColours, MANUAL_ROW_COUNT, type KeyColour} from "./RegisterConfiguration.ts";

/** Number of keys in a manual column (rows alternate 5, 4, 4). */
export function getColumnSize(column: number): number {
    return column % 3 === 0 ? 5 : 4;
}

/** Colour of every key, in left-to-right, column-by-column order. */
export const KEY_COLOURS: KeyColour[] = getManualKeyColours();

/** Position of every key among the keys of its colour (used to resolve register tones). */
export const KEY_COLOUR_POSITIONS: number[] = computeKeyColourPositions(KEY_COLOURS);

export const KEY_COUNT = KEY_COLOURS.length;

/** Index of the first key of every column. */
const COLUMN_FIRST_KEY: number[] = [];

/** Column of every key. */
export const KEY_COLUMNS: number[] = [];

for (let column = 0; column < MANUAL_ROW_COUNT; column++) {
    COLUMN_FIRST_KEY.push(KEY_COLUMNS.length);
    for (let slot = 0; slot < getColumnSize(column); slot++) {
        KEY_COLUMNS.push(column);
    }
}

/** Global key index for the `slot`-th key (0 = first) of a column. */
export function getKeyIndex(column: number, slot: number): number {
    if (column < 0 || column >= MANUAL_ROW_COUNT || slot < 0 || slot >= getColumnSize(column)) {
        throw new RangeError(`No key at column ${column}, slot ${slot}`);
    }
    return COLUMN_FIRST_KEY[column] + slot;
}

/** Whether the column sits under a black piano key. */
export function isBlackKeyColumn(column: number): boolean {
    return [1, 3, 6, 8, 10].includes((column + 5) % 12);
}
