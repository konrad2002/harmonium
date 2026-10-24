import {describe, it, expect} from "vitest";
import type {ComposeNote} from "../model/ComposeNote.ts";
import {assignLanes, dragNote, getActiveKeys, getActiveNotes, getCompositionDuration, snapTime} from "./ComposeTimelineHelper.ts";
import {EXAMPLE_COMPOSITION} from "../data/ExampleComposition.ts";
import {KEY_COLUMNS, KEY_COUNT} from "../data/ManualLayout.ts";

function note(id: string, key: number, start: number, duration: number): ComposeNote {
    return {id, key, start, duration};
}

// Keys 0-4 share column 0, keys 5-8 share column 1
const columnOfKey = (key: number) => KEY_COLUMNS[key];

describe("getCompositionDuration", () => {
    it("is 0 without notes", () => {
        expect(getCompositionDuration([])).toBe(0);
    });

    it("is the end of the last finishing note", () => {
        expect(getCompositionDuration([note("a", 0, 0, 5), note("b", 1, 2, 1)])).toBe(5);
    });
});

describe("snapTime", () => {
    it("rounds to the nearest grid step", () => {
        expect(snapTime(0.19)).toBe(0.25);
        expect(snapTime(0.06)).toBe(0);
        expect(snapTime(1.01)).toBe(1);
    });
});

describe("dragNote", () => {
    const n = note("a", 0, 1, 0.5);

    it("moves the note without changing its length", () => {
        expect(dragNote(n, "move", 0.5)).toEqual({start: 1.5, duration: 0.5});
        expect(dragNote(n, "move", -5)).toEqual({start: 0, duration: 0.5});
    });

    it("resizes the upper edge and keeps the start", () => {
        expect(dragNote(n, "resize-end", 0.5)).toEqual({start: 1, duration: 1});
        expect(dragNote(n, "resize-end", -5)).toEqual({start: 1, duration: 0.125});
    });

    it("resizes the lower edge and keeps the end", () => {
        expect(dragNote(n, "resize-start", -0.25)).toEqual({start: 0.75, duration: 0.75});
        expect(dragNote(n, "resize-start", 5)).toEqual({start: 1.375, duration: 0.125});
        expect(dragNote(n, "resize-start", -5)).toEqual({start: 0, duration: 1.5});
    });
});

describe("getActiveNotes", () => {
    it("leaves a gap between notes that directly follow each other on a key", () => {
        const notes = [note("a", 3, 0, 0.5), note("b", 3, 0.5, 0.5)];

        expect(getActiveNotes(notes, 0.3).map(n => n.id)).toEqual(["a"]);
        expect(getActiveNotes(notes, 0.49)).toEqual([]);
        expect(getActiveNotes(notes, 0.5).map(n => n.id)).toEqual(["b"]);
    });

    it("keeps very short notes audible", () => {
        expect(getActiveNotes([note("a", 3, 1, 0.05)], 1).map(n => n.id)).toEqual(["a"]);
    });

    it("only returns the note being played when the same key repeats", () => {
        const notes = [note("a", 3, 0, 0.25), note("b", 3, 0.5, 0.25), note("c", 3, 1, 0.25)];

        expect(getActiveNotes(notes, 0.1).map(n => n.id)).toEqual(["a"]);
        expect(getActiveNotes(notes, 0.3)).toEqual([]);
        expect(getActiveNotes(notes, 0.6).map(n => n.id)).toEqual(["b"]);
    });
});

describe("getActiveKeys", () => {
    const notes = [note("a", 3, 1, 2), note("b", 7, 2, 1)];

    it("includes a note from its start up to, excluding, its end", () => {
        expect([...getActiveKeys(notes, 1)]).toEqual([3]);
        expect([...getActiveKeys(notes, 2.5)].sort()).toEqual([3, 7]);
        expect([...getActiveKeys(notes, 3)]).toEqual([]);
    });

    it("is empty before the first note", () => {
        expect(getActiveKeys(notes, 0).size).toBe(0);
    });
});

describe("assignLanes", () => {
    it("gives lone notes the full column", () => {
        const lanes = assignLanes([note("a", 0, 0, 1), note("b", 0, 2, 1)], columnOfKey);
        expect(lanes.get("a")).toEqual({lane: 0, lanes: 1});
        expect(lanes.get("b")).toEqual({lane: 0, lanes: 1});
    });

    it("splits the column between overlapping notes of different keys", () => {
        const lanes = assignLanes([note("a", 0, 0, 2), note("b", 1, 1, 2)], columnOfKey);
        expect(lanes.get("a")).toEqual({lane: 0, lanes: 2});
        expect(lanes.get("b")).toEqual({lane: 1, lanes: 2});
    });

    it("reuses a free lane inside one overlapping cluster", () => {
        const lanes = assignLanes([
            note("a", 0, 0, 1),
            note("b", 1, 0.5, 3),
            note("c", 2, 1.5, 1),
        ], columnOfKey);
        expect(lanes.get("a")).toEqual({lane: 0, lanes: 2});
        expect(lanes.get("b")).toEqual({lane: 1, lanes: 2});
        expect(lanes.get("c")).toEqual({lane: 0, lanes: 2});
    });

    it("does not share lanes between columns", () => {
        const lanes = assignLanes([note("a", 0, 0, 2), note("b", 5, 0, 2)], columnOfKey);
        expect(lanes.get("a")).toEqual({lane: 0, lanes: 1});
        expect(lanes.get("b")).toEqual({lane: 0, lanes: 1});
    });
});

describe("EXAMPLE_COMPOSITION", () => {
    it("only uses existing keys and has unique ids", () => {
        for (const {key} of EXAMPLE_COMPOSITION) {
            expect(key).toBeGreaterThanOrEqual(0);
            expect(key).toBeLessThan(KEY_COUNT);
        }
        expect(new Set(EXAMPLE_COMPOSITION.map(n => n.id)).size).toBe(EXAMPLE_COMPOSITION.length);
    });
});
