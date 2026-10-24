import {useCallback, useMemo, useSyncExternalStore} from "react";
import type {Register} from "../core/data/RegisterConfiguration.ts";
import {
    defaultRegisterSelection,
    parseRegisterSelection,
    type RegisterSelection,
} from "../core/data/RegisterSelection.ts";

const STORAGE_KEY = "harmonium.registerSelection";

function load(): RegisterSelection | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored === null ? null : parseRegisterSelection(JSON.parse(stored));
    } catch {
        return null;
    }
}

// Shared by all views and saved. null = nothing chosen yet, so the defaults of registers.json apply.
let selection: RegisterSelection | null = load();
const listeners = new Set<() => void>();

export function getRegisterSelection(): RegisterSelection | null {
    return selection;
}

export function setRegisterSelection(next: RegisterSelection): void {
    selection = next;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
        console.warn("Could not save the register selection:", error);
    }
    listeners.forEach(listener => listener());
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/**
 * Hook for managing register selection state
 *
 * Tracks which register is active for each color (red, white, blue, yellow).
 * Only one register per color can be active at a time.
 */
export function useRegisterSelection(registers: Register[]) {
    const stored = useSyncExternalStore(subscribe, getRegisterSelection);

    // Map color -> active register ID
    const activeRegisters = useMemo(() => {
        const effective = stored ?? defaultRegisterSelection(registers);
        return new Map(Object.entries(effective).filter(([colour, id]) =>
            registers.some(register => register.id === id && register.colour === colour)));
    }, [stored, registers]);

    const toggleRegister = useCallback((registerId: number, colour: string) => {
        const next = {...(getRegisterSelection() ?? defaultRegisterSelection(registers))};

        if (next[colour] === registerId) {
            // Deactivate the register
            delete next[colour];
        } else {
            // Activate this register (deactivates others for the same color)
            next[colour] = registerId;
        }

        setRegisterSelection(next);
    }, [registers]);

    const isRegisterActive = useCallback((registerId: number, colour: string): boolean => {
        return activeRegisters.get(colour) === registerId;
    }, [activeRegisters]);

    const getActiveRegisterForColor = useCallback((colour: string): Register | null => {
        const registerId = activeRegisters.get(colour);
        if (!registerId) return null;
        return registers.find(r => r.id === registerId) || null;
    }, [activeRegisters, registers]);

    const getActiveRegisterIds = useCallback((): number[] => {
        return Array.from(activeRegisters.values());
    }, [activeRegisters]);

    return {
        activeRegisters,
        toggleRegister,
        isRegisterActive,
        getActiveRegisterForColor,
        getActiveRegisterIds,
    };
}
