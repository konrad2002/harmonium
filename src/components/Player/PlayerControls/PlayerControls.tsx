import style from "./PlayerControls.module.scss";
import useSongPlayer from "../../../hooks/useSongPlayer.ts";
import type {Song} from "../../../core/model/Song.ts";

type PlayerControlsProps = {
    song: Song | null;
    onPlayingFrequencies?: (frequencies: Set<number>) => void;
};

export default function PlayerControls({song, onPlayingFrequencies}: PlayerControlsProps) {
    const {state, currentTime, duration, play, pause, stop, seek} = useSongPlayer(song, {onPlayingFrequencies});

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
                    aria-label="Stop playback"
                >
                    ⏹ Stop
                </button>
                <button
                    type="button"
                    className={style.Button}
                    onClick={isPlaying ? pause : play}
                    disabled={!song}
                    aria-label={isPlaying ? "Pause playback" : "Play"}
                >
                    {isPlaying ? "⏸ Pause" : "▶ Play"}
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
                    aria-label="Seek position"
                />
            </div>
        </div>
    );
}
