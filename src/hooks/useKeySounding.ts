import {useEffect, useRef} from "react";
import type {ComposeNote} from "../core/model/ComposeNote.ts";
import type {HarmoniumTone} from "../core/model/HarmoniumTone.ts";
import useHarmoniumSynth from "./useHarmoniumSynth.ts";

/**
 * Sounds the tone of every active note, one sound per note: a note that ends and a note on the
 * same key that starts count as two sounds, so the key is struck again.
 */
export default function useKeySounding(
    notes: ComposeNote[],
    activeNoteIds: ReadonlySet<string>,
    keyTones: (HarmoniumTone | null)[],
) {
    const {playTone, stopTone} = useHarmoniumSynth();

    // Frequency sounding for each note
    const soundingRef = useRef(new Map<string, number>());

    useEffect(() => {
        const sounding = soundingRef.current;

        // Stop first, so that a tone ending and starting again is released before it is struck
        for (const [id, frequency] of sounding) {
            if (!activeNoteIds.has(id)) {
                stopTone(frequency);
                sounding.delete(id);
            }
        }

        for (const note of notes) {
            const tone = keyTones[note.key];
            if (!activeNoteIds.has(note.id) || sounding.has(note.id) || !tone) continue;
            playTone(tone.frequency);
            sounding.set(note.id, tone.frequency);
        }
    }, [notes, activeNoteIds, keyTones, playTone, stopTone]);

    // Release everything when leaving the view
    useEffect(() => {
        const sounding = soundingRef.current;
        return () => {
            for (const frequency of sounding.values()) stopTone(frequency);
            sounding.clear();
        };
    }, [stopTone]);
}
