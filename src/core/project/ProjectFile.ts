import type {ComposeNote} from "../model/ComposeNote.ts";
import {ENGINE_IDS, type EngineId} from "../audio/ToneEngine.ts";
import {parseStoredNotes} from "../data/CompositionStorage.ts";
import {parseStoredSetup, type KeyboardSetup} from "../data/KeyboardMapping.ts";
import type {Register} from "../data/RegisterConfiguration.ts";
import {parseRegisterSelection, type RegisterSelection} from "../data/RegisterSelection.ts";

export const PROJECT_FORMAT = "harmonium-project";
export const PROJECT_VERSION = 1;

export class ProjectFormatError extends Error {}

/** Everything that makes up the state of the app (preferences like language and theme excluded). */
export interface ProjectState {
    composition: ComposeNote[];
    keyboard: KeyboardSetup;
    registers: RegisterSelection;
    soundEngine: EngineId;
}

export function serializeProject(state: ProjectState, savedAt = new Date()): string {
    return JSON.stringify({
        format: PROJECT_FORMAT,
        version: PROJECT_VERSION,
        savedAt: savedAt.toISOString(),
        ...state,
    }, null, 2);
}

/**
 * Reads and validates a project file. Sections that are missing stay undefined (so they are left
 * as they are); a section that is present but invalid rejects the whole file.
 */
export function parseProject(text: string, registers: Register[]): Partial<ProjectState> {
    let raw: unknown;
    try {
        raw = JSON.parse(text);
    } catch {
        throw new ProjectFormatError("The file is not valid JSON");
    }

    if (typeof raw !== "object" || raw === null || (raw as Record<string, unknown>).format !== PROJECT_FORMAT) {
        throw new ProjectFormatError("This is not a Harmonium project file");
    }

    const file = raw as Record<string, unknown>;
    if (typeof file.version !== "number" || file.version > PROJECT_VERSION) {
        throw new ProjectFormatError("The file was saved by a newer version of the app");
    }

    const state: Partial<ProjectState> = {};

    if (file.composition !== undefined) {
        const composition = parseStoredNotes(file.composition);
        if (!composition) throw new ProjectFormatError("The composition in the file is invalid");
        state.composition = composition;
    }

    if (file.keyboard !== undefined) {
        const keyboard = parseStoredSetup(file.keyboard);
        if (!keyboard) throw new ProjectFormatError("The keyboard layout in the file is invalid");
        state.keyboard = keyboard;
    }

    if (file.registers !== undefined) {
        const selection = parseRegisterSelection(file.registers, registers);
        if (!selection) throw new ProjectFormatError("The registers in the file are invalid or unknown");
        state.registers = selection;
    }

    if (file.soundEngine !== undefined) {
        if (!ENGINE_IDS.includes(file.soundEngine as EngineId)) {
            throw new ProjectFormatError("The sound setting in the file is invalid");
        }
        state.soundEngine = file.soundEngine as EngineId;
    }

    if (Object.keys(state).length === 0) {
        throw new ProjectFormatError("The file contains no data");
    }

    return state;
}
