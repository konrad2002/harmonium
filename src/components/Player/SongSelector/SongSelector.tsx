import style from "./SongSelector.module.scss";
import type {Song} from "../../../core/model/Song.ts";

type SongSelectorProps = {
    songs: Song[];
    selectedSong: Song | null;
    onSelectSong: (song: Song) => void;
};

export default function SongSelector({songs, selectedSong, onSelectSong}: SongSelectorProps) {
    return (
        <div className={style.SongSelector}>
            <label htmlFor="song-select">Pre-programmed piece:</label>
            <select
                id="song-select"
                value={selectedSong?.title ?? ""}
                onChange={(e) => {
                    const song = songs.find(s => s.title === e.target.value);
                    if (song) onSelectSong(song);
                }}
            >
                <option value="">-- Select a song --</option>
                {songs.map(song => (
                    <option key={song.title} value={song.title}>
                        {song.title}
                    </option>
                ))}
            </select>
        </div>
    );
}
