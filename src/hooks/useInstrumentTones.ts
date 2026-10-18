import {useEffect, useMemo, useState} from "react";
import type {HarmoniumTone} from "../core/model/HarmoniumTone.ts";
import {parseCSV} from "../core/helper/CsvHelper.ts";
import {useRegisterSelection} from "./useRegisterSelection.ts";
import {
    buildToneIndex,
    loadRegisters,
    resolveRegisterTone,
    type Register,
} from "../core/data/RegisterConfiguration.ts";
import {KEY_COLOURS, KEY_COLOUR_POSITIONS} from "../core/data/ManualLayout.ts";

const BASE_FREQUENCY = 42.8;

export interface InstrumentTones {
    // All tones of the tuning (raw, without register mapping)
    tones: HarmoniumTone[];
    registers: Register[];
    activeRegisterIds: number[];
    toggleRegister: (registerId: number, colour: string) => void;
    // Tone of every manual key for the active registers; null for unassigned keys.
    keyTones: (HarmoniumTone | null)[];
}

/** Loads the tuning and registers and resolves which tone each manual key plays. */
export function useInstrumentTones(): InstrumentTones {
    const [tones, setTones] = useState<HarmoniumTone[]>([]);
    const [registers, setRegisters] = useState<Register[]>([]);

    const {activeRegisters, toggleRegister, getActiveRegisterIds} = useRegisterSelection(registers);

    useEffect(() => {
        fetch("/tones.csv")
            .then(res => res.text())
            .then(text => setTones(parseCSV(text, BASE_FREQUENCY)));

        loadRegisters().then(setRegisters);
    }, []);

    const toneIndex = useMemo(() => buildToneIndex(tones), [tones]);

    const keyTones = useMemo(() => KEY_COLOURS.map((colour, key) => {
        const registerId = activeRegisters.get(colour);
        const register = registers.find(r => r.id === registerId);
        return resolveRegisterTone(register, KEY_COLOUR_POSITIONS[key], toneIndex, colour);
    }), [activeRegisters, registers, toneIndex]);

    const activeRegisterIds = useMemo(() => getActiveRegisterIds(), [getActiveRegisterIds]);

    return {tones, registers, activeRegisterIds, toggleRegister, keyTones};
}
