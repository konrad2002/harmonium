import {describe, it, expect} from "vitest";
import {
    KEY_COLOURS,
    KEY_COLUMNS,
    KEY_COUNT,
    getColumnSize,
    getKeyIndex,
    isBlackKeyColumn,
} from "./ManualLayout.ts";
import {MANUAL_ROW_COUNT, getKeyColour} from "./RegisterConfiguration.ts";

describe("ManualLayout", () => {
    it("has one column entry and one colour per key", () => {
        expect(KEY_COLUMNS).toHaveLength(KEY_COUNT);
        expect(KEY_COLOURS).toHaveLength(KEY_COUNT);
    });

    it("alternates 5, 4, 4 keys per column", () => {
        expect([0, 1, 2, 3].map(getColumnSize)).toEqual([5, 4, 4, 5]);
    });

    it("maps keys to columns in order, with every column holding its keys", () => {
        for (let column = 0; column < MANUAL_ROW_COUNT; column++) {
            const keys = KEY_COLUMNS.filter(c => c === column);
            expect(keys).toHaveLength(getColumnSize(column));
        }
        expect(KEY_COLUMNS).toEqual([...KEY_COLUMNS].sort((a, b) => a - b));
    });

    it("finds the key index of a column slot and its colour", () => {
        expect(getKeyIndex(0, 0)).toBe(0);
        expect(getKeyIndex(0, 4)).toBe(4);
        expect(getKeyIndex(1, 0)).toBe(5);
        expect(getKeyIndex(2, 0)).toBe(9);

        for (let column = 0; column < MANUAL_ROW_COUNT; column++) {
            for (let slot = 0; slot < getColumnSize(column); slot++) {
                const key = getKeyIndex(column, slot);
                expect(KEY_COLUMNS[key]).toBe(column);
                expect(KEY_COLOURS[key]).toBe(getKeyColour(column, slot));
            }
        }
    });

    it("rejects slots outside of the column", () => {
        expect(() => getKeyIndex(1, 4)).toThrow(RangeError);
        expect(() => getKeyIndex(-1, 0)).toThrow(RangeError);
        expect(() => getKeyIndex(MANUAL_ROW_COUNT, 0)).toThrow(RangeError);
    });

    it("marks the columns under black piano keys", () => {
        // Column 0 is F, so column 1 is Fis
        expect(isBlackKeyColumn(0)).toBe(false);
        expect(isBlackKeyColumn(1)).toBe(true);
    });
});
