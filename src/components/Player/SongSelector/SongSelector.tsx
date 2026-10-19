import style from "./SongSelector.module.scss";
import type {Song} from "../../../core/model/Song.ts";
import {translateSongTitle, useI18n} from "../../../i18n.tsx";

type SongSelectorProps = {
    songs: Song[];
    selectedSong: Song | null;
    onSelectSong: (song: Song) => void;
};

export default function SongSelector({songs, selectedSong, onSelectSong}: SongSelectorProps) {
    const {t} = useI18n();

    return (
        <div className={style.SongSelector}>
            <label htmlFor="song-select">{t("song.presetLabel")}</label>
            <select
                id="song-select"
                value={selectedSong?.title ?? ""}
                onChange={(e) => {
                    const song = songs.find(s => s.title === e.target.value);
                    if (song) onSelectSong(song);
                }}
            >
                <option value="">{t("song.selectPlaceholder")}</option>
                {songs.map(song => (
                    <option key={song.title} value={song.title}>
                        {translateSongTitle(song.title, t)}
                    </option>
                ))}
            </select>
        </div>
    );
}
