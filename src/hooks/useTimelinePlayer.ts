import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject} from "react";
import type {ComposeNote} from "../core/model/ComposeNote.ts";
import {getActiveNotes} from "../core/helper/ComposeTimelineHelper.ts";

export type TimelinePlayerState = "stopped" | "playing" | "paused";

const NO_NOTES: ReadonlySet<string> = new Set();

function sameIds(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
    if (a.size !== b.size) return false;
    for (const id of a) if (!b.has(id)) return false;
    return true;
}

type Options = {
    notes: ComposeNote[];
    // Total length in seconds
    duration: number;
    pixelsPerSecond: number;
    // The vertically scrolling timeline. Time 0 is at the bottom, later time further up, so
    // playing scrolls the content downwards past the fixed playhead at the bottom edge.
    scrollRef: RefObject<HTMLDivElement | null>;
};

/**
 * Plays a compose timeline: moves the scroll position with the clock and reports which keys
 * are currently under the playhead. While not playing, scrolling the timeline seeks.
 */
export default function useTimelinePlayer({notes, duration, pixelsPerSecond, scrollRef}: Options) {
    const [state, setState] = useState<TimelinePlayerState>("stopped");
    const [activeNoteIds, setActiveNoteIds] = useState<ReadonlySet<string>>(NO_NOTES);
    // Rounded to tenths of a second so display updates don't re-render every frame
    const [displayTime, setDisplayTime] = useState(0);

    const timeRef = useRef(0);
    const startedAtRef = useRef(0);
    const activeRef = useRef<ReadonlySet<string>>(NO_NOTES);

    const applyScroll = useCallback((time: number) => {
        const element = scrollRef.current;
        if (element) element.scrollTop = (duration - time) * pixelsPerSecond;
    }, [scrollRef, duration, pixelsPerSecond]);

    const setTime = useCallback((time: number) => {
        timeRef.current = time;
        applyScroll(time);
        setDisplayTime(Math.round(time * 10) / 10);
    }, [applyScroll]);

    const publishActiveNotes = useCallback((ids: ReadonlySet<string>) => {
        if (sameIds(ids, activeRef.current)) return;
        activeRef.current = ids;
        setActiveNoteIds(ids);
    }, []);

    const activeKeys = useMemo(
        () => new Set(notes.filter(note => activeNoteIds.has(note.id)).map(note => note.key)),
        [notes, activeNoteIds]
    );

    const stop = useCallback(() => {
        setState("stopped");
        setTime(0);
        publishActiveNotes(NO_NOTES);
    }, [setTime, publishActiveNotes]);

    const pause = useCallback(() => {
        setState("paused");
        publishActiveNotes(NO_NOTES);
    }, [publishActiveNotes]);

    const play = useCallback(() => {
        if (duration <= 0) return;
        if (timeRef.current >= duration) setTime(0);
        setState("playing");
    }, [duration, setTime]);

    // Keep the scroll position matching the current time (initial layout, changed duration)
    useLayoutEffect(() => {
        applyScroll(timeRef.current);
    }, [applyScroll]);

    useEffect(() => {
        if (state !== "playing") return;

        startedAtRef.current = performance.now() - timeRef.current * 1000;
        let frame = 0;

        const tick = () => {
            const time = (performance.now() - startedAtRef.current) / 1000;
            if (time >= duration) {
                stop();
                return;
            }
            setTime(time);
            publishActiveNotes(new Set(getActiveNotes(notes, time).map(note => note.id)));
            frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [state, notes, duration, setTime, publishActiveNotes, stop]);

    const handleScroll = useCallback(() => {
        const element = scrollRef.current;
        if (!element || state === "playing") return;

        const time = Math.min(Math.max(duration - element.scrollTop / pixelsPerSecond, 0), duration);
        // Ignore the scroll events caused by our own scroll updates
        if (Math.abs(time - timeRef.current) < 1 / pixelsPerSecond) return;

        timeRef.current = time;
        setDisplayTime(Math.round(time * 10) / 10);
    }, [scrollRef, state, duration, pixelsPerSecond]);

    // Jump to a time; playback continues from there if it is running
    const seek = useCallback((time: number) => {
        const target = Math.min(Math.max(time, 0), duration);
        setTime(target);
        startedAtRef.current = performance.now() - target * 1000;
    }, [duration, setTime]);

    return {state, activeKeys, activeNoteIds, currentTime: displayTime, play, pause, stop, seek, handleScroll};
}
