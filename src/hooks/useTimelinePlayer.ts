import {useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject} from "react";
import type {ComposeNote} from "../core/model/ComposeNote.ts";
import {getActiveKeys} from "../core/helper/ComposeTimelineHelper.ts";

export type TimelinePlayerState = "stopped" | "playing" | "paused";

const NO_KEYS: ReadonlySet<number> = new Set();

function sameKeys(a: ReadonlySet<number>, b: ReadonlySet<number>): boolean {
    if (a.size !== b.size) return false;
    for (const key of a) if (!b.has(key)) return false;
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
    const [activeKeys, setActiveKeys] = useState<ReadonlySet<number>>(NO_KEYS);
    // Rounded to tenths of a second so display updates don't re-render every frame
    const [displayTime, setDisplayTime] = useState(0);

    const timeRef = useRef(0);
    const activeRef = useRef<ReadonlySet<number>>(NO_KEYS);

    const applyScroll = useCallback((time: number) => {
        const element = scrollRef.current;
        if (element) element.scrollTop = (duration - time) * pixelsPerSecond;
    }, [scrollRef, duration, pixelsPerSecond]);

    const setTime = useCallback((time: number) => {
        timeRef.current = time;
        applyScroll(time);
        setDisplayTime(Math.round(time * 10) / 10);
    }, [applyScroll]);

    const publishActiveKeys = useCallback((keys: ReadonlySet<number>) => {
        if (sameKeys(keys, activeRef.current)) return;
        activeRef.current = keys;
        setActiveKeys(keys);
    }, []);

    const stop = useCallback(() => {
        setState("stopped");
        setTime(0);
        publishActiveKeys(NO_KEYS);
    }, [setTime, publishActiveKeys]);

    const pause = useCallback(() => {
        setState("paused");
        publishActiveKeys(NO_KEYS);
    }, [publishActiveKeys]);

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

        const startedAt = performance.now() - timeRef.current * 1000;
        let frame = 0;

        const tick = () => {
            const time = (performance.now() - startedAt) / 1000;
            if (time >= duration) {
                stop();
                return;
            }
            setTime(time);
            publishActiveKeys(getActiveKeys(notes, time));
            frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [state, notes, duration, setTime, publishActiveKeys, stop]);

    const handleScroll = useCallback(() => {
        const element = scrollRef.current;
        if (!element || state === "playing") return;

        const time = Math.min(Math.max(duration - element.scrollTop / pixelsPerSecond, 0), duration);
        // Ignore the scroll events caused by our own scroll updates
        if (Math.abs(time - timeRef.current) < 1 / pixelsPerSecond) return;

        timeRef.current = time;
        setDisplayTime(Math.round(time * 10) / 10);
    }, [scrollRef, state, duration, pixelsPerSecond]);

    return {state, activeKeys, currentTime: displayTime, play, pause, stop, handleScroll};
}
