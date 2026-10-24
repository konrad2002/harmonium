import type {Register} from "./RegisterConfiguration.ts";

/** Colour -> id of the register pulled for that colour. Colours without an entry have none. */
export type RegisterSelection = Record<string, number>;

const COLOURS = ["red", "white", "blue", "yellow"];

/** The registers marked "active" in registers.json. */
export function defaultRegisterSelection(registers: Register[]): RegisterSelection {
    const selection: RegisterSelection = {};
    for (const register of registers) {
        if (register.active) selection[register.colour] = register.id;
    }
    return selection;
}

/**
 * Validates a register selection; returns null if it is not one. With `registers`, every
 * entry also has to be an existing register of that colour.
 */
export function parseRegisterSelection(raw: unknown, registers?: Register[]): RegisterSelection | null {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;

    const selection: RegisterSelection = {};
    for (const [colour, id] of Object.entries(raw)) {
        if (!COLOURS.includes(colour) || typeof id !== "number" || !Number.isInteger(id)) return null;
        if (registers && !registers.some(register => register.id === id && register.colour === colour)) return null;
        selection[colour] = id;
    }
    return selection;
}
