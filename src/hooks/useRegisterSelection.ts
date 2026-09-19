import {useState, useCallback} from "react";
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
