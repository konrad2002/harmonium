import {useState, useCallback, useEffect} from "react";
import type {Register} from "../core/data/RegisterConfiguration.ts";

/**
 * Hook for managing register selection state
 * 
 * Tracks which register is active for each color (red, white, blue, yellow).
 * Only one register per color can be active at a time.
 */
export function useRegisterSelection(registers: Register[]) {
    // Map color -> active register ID
    const [activeRegisters, setActiveRegisters] = useState<Map<string, number>>(new Map());

    // Once registers are loaded, default to each colour's register marked "active" in
    // registers.json, without overriding a selection the user already made.
    useEffect(() => {
        if (registers.length === 0) return;

        setActiveRegisters(prev => {
            if (prev.size > 0) return prev;

            const defaults = new Map<string, number>();
            for (const register of registers) {
                if (register.active) defaults.set(register.colour, register.id);
            }
            return defaults;
        });
    }, [registers]);

    const toggleRegister = useCallback((registerId: number, colour: string) => {
        setActiveRegisters(prev => {
            const newMap = new Map(prev);

            // Get the currently active register for this colour
            const currentRegisterForColor = newMap.get(colour);

            if (currentRegisterForColor === registerId) {
                // Deactivate the register
                newMap.delete(colour);
            } else {
                // Activate this register (deactivates others for the same color)
                newMap.set(colour, registerId);
            }

            return newMap;
        });
    }, []);

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
