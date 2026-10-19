import {useCallback} from "react";
import {getDestination} from "tone";
import {getActiveEngine} from "../core/audio/soundEngines.ts";

// Sounds a frequency with the currently selected tone generation (synth or recorded sample),
// for any view (Manual, song playback, compose) that needs to play the instrument.
export default function useHarmoniumSynth() {
    const playTone = useCallback((frequency: number) => {
        getActiveEngine().playTone(frequency);
    }, []);

    const stopTone = useCallback((frequency: number) => {
        getActiveEngine().stopTone(frequency);
    }, []);

    const setVolume = useCallback((volumeDb: number) => {
        getDestination().volume.value = volumeDb;
    }, []);

    return {playTone, stopTone, setVolume};
}
