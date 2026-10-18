import {useEffect, useMemo, useRef} from "react";
import style from "./ComposeView.module.scss";
import Manual from "../../ManualView/Manual/Manual.tsx";
import ComposeTimeline from "../../Compose/ComposeTimeline/ComposeTimeline.tsx";
import VolumeControl from "../../Player/VolumeControl/VolumeControl.tsx";
import useHarmoniumSynth from "../../../hooks/useHarmoniumSynth.ts";
import {useInstrumentTones} from "../../../hooks/useInstrumentTones.ts";
import useTimelinePlayer from "../../../hooks/useTimelinePlayer.ts";
import {EXAMPLE_COMPOSITION} from "../../../core/data/ExampleComposition.ts";
import {getCompositionDuration} from "../../../core/helper/ComposeTimelineHelper.ts";

const PIXELS_PER_SECOND = 120;

function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds - minutes * 60).toFixed(1).padStart(4, "0")}`;
}

/**
 * Compose view: a timeline whose columns line up with the manual below it. Boxes fall down
 * onto a fixed line and sound the key underneath. (Static example; editing comes later.)
 */
export default function ComposeView() {
    const instrument = useInstrumentTones();
    const {playTone, stopTone} = useHarmoniumSynth();

    const notes = EXAMPLE_COMPOSITION;
    const duration = useMemo(() => getCompositionDuration(notes), [notes]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const player = useTimelinePlayer({notes, duration, pixelsPerSecond: PIXELS_PER_SECOND, scrollRef});

    // Frequency sounding for each key under the playhead
    const soundingRef = useRef(new Map<number, number>());

    useEffect(() => {
        const sounding = soundingRef.current;

        for (const [key, frequency] of sounding) {
            if (!player.activeKeys.has(key)) {
                stopTone(frequency);
                sounding.delete(key);
            }
        }

        for (const key of player.activeKeys) {
            const tone = instrument.keyTones[key];
            if (sounding.has(key) || !tone) continue;
            playTone(tone.frequency);
            sounding.set(key, tone.frequency);
        }
    }, [player.activeKeys, instrument.keyTones, playTone, stopTone]);

    // Release everything when leaving the view
    useEffect(() => {
        const sounding = soundingRef.current;
        return () => {
            for (const frequency of sounding.values()) stopTone(frequency);
            sounding.clear();
        };
    }, [stopTone]);

    const isPlaying = player.state === "playing";

    return (
        <>
            <div className={style.Controls}>
                <div className={style.ButtonGroup}>
                    <button type="button" className={style.Button} onClick={player.stop} aria-label="Stop playback">
                        ⏹ Stop
                    </button>
                    <button
                        type="button"
                        className={style.Button}
                        onClick={isPlaying ? player.pause : player.play}
                        aria-label={isPlaying ? "Pause playback" : "Play"}
                    >
                        {isPlaying ? "⏸ Pause" : "▶ Play"}
                    </button>
                </div>
                <div className={style.Time}>{formatTime(player.currentTime)} / {formatTime(duration)}</div>
                <VolumeControl/>
            </div>
            <Manual
                layout="compose"
                instrument={instrument}
                activeKeys={player.activeKeys}
                showVolume={false}
                topSlot={
                    <ComposeTimeline
                        notes={notes}
                        keyTones={instrument.keyTones}
                        activeKeys={player.activeKeys}
                        duration={duration}
                        pixelsPerSecond={PIXELS_PER_SECOND}
                        scrollRef={scrollRef}
                        onScroll={player.handleScroll}
                    />
                }
            />
        </>
    );
}
