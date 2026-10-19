import {useSyncExternalStore} from "react";
import {getSoundState, selectEngine, subscribeToSoundState} from "../core/audio/soundEngines.ts";

/** The selected tone generation and its load status, plus a way to change it. */
export function useSoundEngine() {
    const state = useSyncExternalStore(subscribeToSoundState, getSoundState);
    return {...state, selectEngine};
}
