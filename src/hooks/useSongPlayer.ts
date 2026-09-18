import {useCallback, useEffect, useRef, useState} from "react";
import {Transport, Part} from "tone";
import useHarmoniumSynth from "./useHarmoniumSynth.ts";
import type {Song} from "../core/model/Song.ts";

export type PlaybackState = "stopped" | "playing" | "paused";

interface UseSongPlayerOptions {
    // Called when a set of frequencies are currently playing (for UI highlight)
    onPlayingFrequencies?: (frequencies: Set<number>) => void;
}

export default function useSongPlayer(song: Song | null, options?: UseSongPlayerOptions) {
    const {playTone, stopTone} = useHarmoniumSynth();
    const [state, setState] = useState<PlaybackState>("stopped");
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const partRef = useRef<Part | null>(null);
    const isPlayingRef = useRef(false);

    // Initialize the Part whenever the song changes
    useEffect(() => {
        if (!song || !song.notes.length) {
            if (partRef.current) {
                partRef.current.dispose();
                partRef.current = null;
            }
            setDuration(0);
            return;
        }

        // Calculate total duration
        const maxTime = Math.max(...song.notes.map(n => n.time + n.duration));
        setDuration(maxTime);

        // Create and schedule the Part
        const part = new Part((time: number, noteData: unknown) => {
            const note = noteData as Song["notes"][0];
            // Schedule the tone attack and release at absolute Tone time
            Transport.schedule(() => {
                playTone(note.frequency);
            }, time);

            Transport.schedule(() => {
                stopTone(note.frequency);
            }, time + note.duration);

            // Notify UI of currently playing frequencies
            if (options?.onPlayingFrequencies) {
                Transport.schedule(() => {
                    const activeTones = song.notes.filter(
                        n => n.time <= time && time < n.time + n.duration
                    );
                    options.onPlayingFrequencies?.(new Set(activeTones.map(n => n.frequency)));
                }, time);

                Transport.schedule(() => {
                    const activeTones = song.notes.filter(
                        n => n.time <= time + note.duration && time + note.duration < n.time + n.duration
                    );
                    options.onPlayingFrequencies?.(new Set(activeTones.map(n => n.frequency)));
                }, time + note.duration);
            }
        }, song.notes.map(n => [n.time, n]));

        partRef.current = part;
        part.start(0);

        return () => {
            part.dispose();
            partRef.current = null;
        };
    }, [song, playTone, stopTone, options]);

    // Update currentTime as Transport plays
    useEffect(() => {
        const interval = setInterval(() => {
            if (isPlayingRef.current) {
                setCurrentTime(Transport.seconds);
            }
        }, 50);

        return () => clearInterval(interval);
    }, []);

    const play = useCallback(() => {
        if (!song || !song.notes.length) return;
        if (state === "playing") return;

        Transport.bpm.value = song.bpm;
        if (state === "stopped") {
            Transport.cancel();
            Transport.seconds = 0;
        }
        Transport.start();
        isPlayingRef.current = true;
        setState("playing");
    }, [song, state]);

    const pause = useCallback(() => {
        if (state !== "playing") return;
        Transport.pause();
        isPlayingRef.current = false;
        setState("paused");
    }, [state]);

    const stop = useCallback(() => {
        Transport.stop();
        Transport.cancel();
        Transport.seconds = 0;
        isPlayingRef.current = false;
        setState("stopped");
        setCurrentTime(0);
        options?.onPlayingFrequencies?.(new Set());
    }, [options]);

    const seek = useCallback((timeInSeconds: number) => {
        Transport.seconds = timeInSeconds;
        setCurrentTime(timeInSeconds);
    }, []);

    return {state, currentTime, duration, play, pause, stop, seek};
}
