import style from "./PlayerControls.module.scss";
import useSongPlayer from "../../../hooks/useSongPlayer.ts";
import type {Song} from "../../../core/model/Song.ts";
import {useI18n} from "../../../i18n.tsx";

type PlayerControlsProps = {
    song: Song | null;
    onPlayingFrequencies?: (frequencies: Set<number>) => void;
};

export default function PlayerControls({song, onPlayingFrequencies}: PlayerControlsProps) {
    const {state, currentTime, duration, play, pause, stop, seek} = useSongPlayer(song, {onPlayingFrequencies});
    const {t} = useI18n();

    function formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    const isPlaying = state === "playing";

    return (
        <div className={style.PlayerControls}>
            <div className={style.ButtonGroup}>
                <button
                    type="button"
                    className={style.Button}
                    onClick={stop}
                    disabled={!song}
                    aria-label={t("playback.stopAria")}
                >
                    {t("playback.stop")}
                </button>
                <button
                    type="button"
                    className={style.Button}
                    onClick={isPlaying ? pause : play}
                    disabled={!song}
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
                    max={duration || 0}
                    value={currentTime}
                    onChange={(e) => seek(Number(e.target.value))}
                    disabled={!song}
                    aria-label={t("playback.seek")}
                />
            </div>
        </div>
    );
}
