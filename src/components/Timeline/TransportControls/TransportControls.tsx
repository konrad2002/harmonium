import {useCallback} from "react";
import style from "./TransportControls.module.scss";
import {formatTime} from "../../../core/helper/TimelineHelper.ts";

export type PlaybackState = "stopped" | "playing" | "paused";

interface TransportControlsProps {
    bpm: number;
    currentTime: number;
    duration: number;
    playbackState: PlaybackState;
    loopEnabled: boolean;
    zoom: number;
    onPlay?: () => void;
    onPause?: () => void;
    onStop?: () => void;
    onSeek?: (time: number) => void;
    onBPMChange?: (bpm: number) => void;
    onZoomChange?: (zoom: number) => void;
    onToggleLoop?: (enabled: boolean) => void;
}

/**
 * Transport controls for timeline playback and editing
 */
export default function TransportControls({
    bpm,
    currentTime,
    duration,
    playbackState,
    loopEnabled,
    zoom,
    onPlay,
    onPause,
    onStop,
    onSeek,
    onBPMChange,
    onZoomChange,
    onToggleLoop,
}: TransportControlsProps) {
    const handlePlayClick = useCallback(() => {
        if (playbackState === "playing") {
            onPause?.();
        } else {
            onPlay?.();
        }
    }, [playbackState, onPlay, onPause]);

    const handleStopClick = useCallback(() => {
        onStop?.();
    }, [onStop]);



    const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newBPM = parseFloat(e.target.value);
        if (!isNaN(newBPM) && newBPM > 0) {
            onBPMChange?.(newBPM);
        }
    };

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = parseFloat(e.target.value);
        if (!isNaN(newZoom)) {
            onZoomChange?.(newZoom);
        }
    };

    const handleLoopToggle = useCallback(() => {
        onToggleLoop?.(!loopEnabled);
    }, [loopEnabled, onToggleLoop]);

    return (
        <div className={style.TransportControls}>
            {/* Playback controls */}
            <div className={style.Section}>
                <button
                    className={`${style.Button} ${
                        playbackState === "playing" ? style.Active : ""
                    }`}
                    onClick={handlePlayClick}
                    title={playbackState === "playing" ? "Pause (Space)" : "Play (Space)"}
                >
                    {playbackState === "playing" ? "⏸" : "▶"}
                </button>
                <button
                    className={style.Button}
                    onClick={handleStopClick}
                    title="Stop (Ctrl+Space)"
                >
                    ⏹
                </button>
                <button
                    className={`${style.Button} ${loopEnabled ? style.Active : ""}`}
                    onClick={handleLoopToggle}
                    title="Loop (L)"
                >
                    🔁
                </button>
            </div>

            {/* Time display */}
            <div className={style.Section}>
                <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.01"
                    value={currentTime}
                    onChange={e => onSeek?.(parseFloat(e.target.value))}
                    className={style.TimelineSlider}
                    title="Click to seek"
                />
                <div className={style.TimeDisplay}>
                    <span>{formatTime(currentTime)}</span>
                    <span>/</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* BPM control */}
            <div className={style.Section}>
                <label htmlFor="bpm-input" className={style.Label}>
                    BPM:
                </label>
                <input
                    id="bpm-input"
                    type="number"
                    value={bpm}
                    onChange={handleBPMChange}
                    min="30"
                    max="300"
                    step="1"
                    className={style.NumberInput}
                />
            </div>

            {/* Zoom control */}
            <div className={style.Section}>
                <label htmlFor="zoom-input" className={style.Label}>
                    Zoom:
                </label>
                <input
                    id="zoom-input"
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={zoom}
                    onChange={handleZoomChange}
                    className={style.ZoomSlider}
                    title="Zoom in/out"
                />
                <span className={style.ZoomValue}>{zoom}%</span>
            </div>
        </div>
    );
}
