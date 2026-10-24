import type {Register} from "../core/data/RegisterConfiguration.ts";
import {defaultRegisterSelection} from "../core/data/RegisterSelection.ts";
import type {ProjectState} from "../core/project/ProjectFile.ts";
import {getSoundState, selectEngine} from "../core/audio/soundEngines.ts";
import {getComposition, setComposition} from "./useComposition.ts";
import {getKeyboardSetup, setKeyboardSetup} from "./useKeyboardSetup.ts";
import {getRegisterSelection, setRegisterSelection} from "./useRegisterSelection.ts";

/** The current state of the app. `registers` are needed for the default register selection. */
export function captureProjectState(registers: Register[]): ProjectState {
    return {
        composition: getComposition(),
        keyboard: getKeyboardSetup(),
        registers: getRegisterSelection() ?? defaultRegisterSelection(registers),
        soundEngine: getSoundState().engineId,
    };
}

/** Replaces the parts of the app state that are present in `state`. */
export function applyProjectState(state: Partial<ProjectState>): void {
    if (state.composition) setComposition(state.composition);
    if (state.keyboard) setKeyboardSetup(state.keyboard);
    if (state.registers) setRegisterSelection(state.registers);
    if (state.soundEngine) selectEngine(state.soundEngine);
}
