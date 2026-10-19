import type {EngineId, EngineStatus, ToneEngine} from "./ToneEngine.ts";
import {SynthEngine} from "./SynthEngine.ts";
import {SampleEngine} from "./SampleEngine.ts";

export const ENGINE_OPTIONS: {id: EngineId; label: string}[] = [
    {id: "synth", label: "Synthesizer"},
    {id: "sample", label: "Recorded sample"},
];

const STORAGE_KEY = "harmonium.soundEngine";

const engines: Record<EngineId, ToneEngine> = {
    synth: new SynthEngine(),
    sample: new SampleEngine(),
};

export interface SoundState {
    engineId: EngineId;
    status: EngineStatus;
}

function isEngineId(value: unknown): value is EngineId {
    return ENGINE_OPTIONS.some(option => option.id === value);
}

function loadStoredEngine(): EngineId {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (isEngineId(stored)) return stored;
    } catch {
        // Storage can be unavailable (private mode); fall back to the default
    }
    return "synth";
}

let state: SoundState = {engineId: loadStoredEngine(), status: {state: "loading"}};
const listeners = new Set<() => void>();

function setState(next: SoundState): void {
    state = next;
    listeners.forEach(listener => listener());
}

function prepare(id: EngineId): void {
    engines[id].prepare().then(
        () => {
            if (state.engineId === id) setState({engineId: id, status: {state: "ready"}});
        },
        (error: unknown) => {
            if (state.engineId !== id) return;
            const message = error instanceof Error ? error.message : String(error);
            setState({engineId: id, status: {state: "error", message}});
        }
    );
}

prepare(state.engineId);

export function subscribeToSoundState(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getSoundState(): SoundState {
    return state;
}

/** Switches the tone generation; selecting the current engine again retries a failed load. */
export function selectEngine(id: EngineId): void {
    if (id === state.engineId && state.status.state !== "error") return;

    engines[state.engineId].stopAll();
    setState({engineId: id, status: {state: "loading"}});

    try {
        localStorage.setItem(STORAGE_KEY, id);
    } catch {
        // Not persisting is fine
    }
    prepare(id);
}

export function getActiveEngine(): ToneEngine {
    return engines[state.engineId];
}
