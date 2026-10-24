import style from "./PlayerControls.module.scss";
import type {TimelinePlayerState} from "../../../hooks/useTimelinePlayer.ts";
import {useI18n} from "../../../i18n.tsx";

type PlayerControlsProps = {
    state: TimelinePlayerState;
    // Seconds
    currentTime: number;
    duration: number;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onSeek: (time: number) => void;
};

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function PlayerControls({state, currentTime, duration, onPlay, onPause, onStop, onSeek}: PlayerControlsProps) {
    const {t} = useI18n();

    const isPlaying = state === "playing";
    const empty = duration <= 0;

    return (
        <div className={style.PlayerControls}>
            <div className={style.ButtonGroup}>
                <button
                    type="button"
                    className={style.Button}
                    onClick={onStop}
                    disabled={empty}
                    aria-label={t("playback.stopAria")}
                >
                    {t("playback.stop")}
                </button>
                <button
                    type="button"
                    className={style.Button}
                    onClick={isPlaying ? onPause : onPlay}
                    disabled={empty}
                    aria-label={isPlaying ? t("playback.pauseAria") : t("playback.playAria")}
                >
                    {isPlaying ? t("playback.pause") : t("playback.play")}
                </button>
            </div>

            <div className={style.TimeDisplay}>
                <span>{formatTime(currentTime)}</span>
                <span> / </span>
                <span>{formatTime(duration)}</span>
            </div>

            <div className={style.ProgressBar}>
                <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={Math.min(currentTime, duration)}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    disabled={empty}
                    aria-label={t("playback.seek")}
                />
            </div>
        </div>
    );
}
