import {useSyncExternalStore} from "react";
import {
    MAX_OCTAVE,
    MIN_OCTAVE,
    defaultSetup,
    parseStoredSetup,
    pianoMapping,
    type KeySlot,
    type KeyboardSetup,
} from "../core/data/KeyboardMapping.ts";
import type {KeyColour} from "../core/data/RegisterConfiguration.ts";

const STORAGE_KEY = "harmonium.keyboardSetup";

function load(): KeyboardSetup {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return (stored && parseStoredSetup(JSON.parse(stored))) || defaultSetup();
    } catch {
        return defaultSetup();
    }
}

// Shared by all views, since they all play the manual with the computer keyboard
let setup: KeyboardSetup = load();
const listeners = new Set<() => void>();

function update(next: KeyboardSetup): void {
    setup = next;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
        console.warn("Could not save the keyboard setup:", error);
    }
    listeners.forEach(listener => listener());
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

const getSetup = () => setup;

export {getSetup as getKeyboardSetup, update as setKeyboardSetup};

const actions = {
    shiftOctave(delta: number) {
        const octave = Math.min(Math.max(setup.octave + delta, MIN_OCTAVE), MAX_OCTAVE);
        if (octave !== setup.octave) update({...setup, octave});
    },
    assign(code: string, slot: KeySlot) {
        update({...setup, mapping: {...setup.mapping, [code]: slot}});
    },
    unassign(code: string) {
        const mapping = {...setup.mapping};
        delete mapping[code];
        update({...setup, mapping});
    },
    resetLayout(colour: KeyColour) {
        update({...setup, mapping: pianoMapping(colour)});
    },
};

/** Octave and key assignment for playing the manual with the computer keyboard. */
export function useKeyboardSetup() {
    return {...useSyncExternalStore(subscribe, getSetup), ...actions};
}
