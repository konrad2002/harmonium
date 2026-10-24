import {describe, it, expect} from "vitest";
import {parseStoredNotes} from "./CompositionStorage.ts";
import {KEY_COUNT} from "./ManualLayout.ts";

const valid = {id: "a", key: 3, start: 0.5, duration: 0.25};

describe("parseStoredNotes", () => {
    it("accepts valid notes and drops unknown fields", () => {
        expect(parseStoredNotes([{...valid, extra: true}, {...valid, id: "b"}])).toEqual([valid, {...valid, id: "b"}]);
        expect(parseStoredNotes([])).toEqual([]);
    });

    it("rejects anything else", () => {
        expect(parseStoredNotes(null)).toBeNull();
        expect(parseStoredNotes({})).toBeNull();
        expect(parseStoredNotes([null])).toBeNull();
        expect(parseStoredNotes([{...valid, id: ""}])).toBeNull();
        expect(parseStoredNotes([valid, valid])).toBeNull();
        expect(parseStoredNotes([{...valid, key: KEY_COUNT}])).toBeNull();
        expect(parseStoredNotes([{...valid, key: 1.5}])).toBeNull();
        expect(parseStoredNotes([{...valid, start: -1}])).toBeNull();
        expect(parseStoredNotes([{...valid, duration: 0}])).toBeNull();
        expect(parseStoredNotes([{...valid, start: "1"}])).toBeNull();
    });
});
