import type {ComposeNote} from "../model/ComposeNote.ts";
import {KEY_COUNT} from "./ManualLayout.ts";

const STORAGE_KEY = "harmonium.composition";

/** Validates stored JSON; returns null unless every note is valid. */
export function parseStoredNotes(raw: unknown): ComposeNote[] | null {
    if (!Array.isArray(raw)) return null;

    const ids = new Set<string>();
    for (const item of raw) {
        if (typeof item !== "object" || item === null) return null;
        const {id, key, start, duration} = item as Record<string, unknown>;

        if (typeof id !== "string" || id === "" || ids.has(id)) return null;
        if (typeof key !== "number" || !Number.isInteger(key) || key < 0 || key >= KEY_COUNT) return null;
        if (typeof start !== "number" || !Number.isFinite(start) || start < 0) return null;
        if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) return null;
        ids.add(id);
    }

    return (raw as ComposeNote[]).map(({id, key, start, duration}) => ({id, key, start, duration}));
}

export function loadStoredNotes(): ComposeNote[] | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored === null ? null : parseStoredNotes(JSON.parse(stored));
    } catch {
        return null;
    }
}

export function saveStoredNotes(notes: ComposeNote[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
        console.warn("Could not save the composition:", error);
    }
}
