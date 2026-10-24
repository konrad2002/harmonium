import {useEffect, useRef} from "react";
import type {HarmoniumTone} from "../core/model/HarmoniumTone.ts";
import useHarmoniumSynth from "./useHarmoniumSynth.ts";

/** Sounds the tones of the given keys for as long as they are active (e.g. under a playhead). */
export default function useKeySounding(activeKeys: ReadonlySet<number>, keyTones: (HarmoniumTone | null)[]) {
    const {playTone, stopTone} = useHarmoniumSynth();

    // Frequency sounding for each key
    const soundingRef = useRef(new Map<number, number>());

    useEffect(() => {
        const sounding = soundingRef.current;

        for (const [key, frequency] of sounding) {
            if (!activeKeys.has(key)) {
                stopTone(frequency);
                sounding.delete(key);
            }
        }

        for (const key of activeKeys) {
            const tone = keyTones[key];
            if (sounding.has(key) || !tone) continue;
            playTone(tone.frequency);
            sounding.set(key, tone.frequency);
        }
    }, [activeKeys, keyTones, playTone, stopTone]);

    // Release everything when leaving the view
    useEffect(() => {
        const sounding = soundingRef.current;
        return () => {
            for (const frequency of sounding.values()) stopTone(frequency);
            sounding.clear();
        };
    }, [stopTone]);
}
