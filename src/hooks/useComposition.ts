import {useSyncExternalStore} from "react";
import type {ComposeNote} from "../core/model/ComposeNote.ts";
import {EXAMPLE_COMPOSITION} from "../core/data/ExampleComposition.ts";
import {loadStoredNotes, saveStoredNotes} from "../core/data/CompositionStorage.ts";

// The composition lives outside of the views so that Compose and Play share it and it survives
// switching between them.
let notes: ComposeNote[] = loadStoredNotes() ?? EXAMPLE_COMPOSITION;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function save() {
    clearTimeout(saveTimer);
    saveStoredNotes(notes);
}

if (typeof window !== "undefined") {
    window.addEventListener("pagehide", save);
}

type NotesUpdate = ComposeNote[] | ((previous: ComposeNote[]) => ComposeNote[]);

function setNotes(update: NotesUpdate): void {
    notes = typeof update === "function" ? update(notes) : update;
    listeners.forEach(listener => listener());

    // Dragging a note changes it many times per second
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 300);
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getNotes(): ComposeNote[] {
    return notes;
}

export {getNotes as getComposition, setNotes as setComposition};

/** The current composition (shared by all views) and a setter that accepts an updater function. */
export function useComposition(): [ComposeNote[], (update: NotesUpdate) => void] {
    return [useSyncExternalStore(subscribe, getNotes), setNotes];
}
