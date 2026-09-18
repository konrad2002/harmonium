import {useCallback, useRef} from "react";
import {now} from "tone";
import useSynth from "./useSynth.ts";

// Shared tone-playing engine for the harmonium instrument, used by any view
// (Manual, Keyboard, future song playback) that needs to sound a frequency.
export default function useHarmoniumSynth() {
    const synthRef = useRef(useSynth());

    const playTone = useCallback((frequency: number) => {
        synthRef.current.triggerAttack(frequency, now(), 1.2);
    }, []);

    const stopTone = useCallback((frequency: number) => {
        synthRef.current.triggerRelease(frequency);
    }, []);

    const setVolume = useCallback((volumeDb: number) => {
        synthRef.current.volume.value = volumeDb;
    }, []);

    return {playTone, stopTone, setVolume};
}
