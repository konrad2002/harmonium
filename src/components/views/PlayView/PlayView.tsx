import {useState} from "react";
import style from "./PlayView.module.scss";
import Manual from "../../ManualView/Manual/Manual.tsx";
import SongSelector from "../../Player/SongSelector/SongSelector.tsx";
import PlayerControls from "../../Player/PlayerControls/PlayerControls.tsx";
import VolumeControl from "../../Player/VolumeControl/VolumeControl.tsx";
import {EXAMPLE_SONGS} from "../../../core/data/ExampleSongs.ts";
import type {Song} from "../../../core/model/Song.ts";

export default function PlayView() {
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [playingFrequencies, setPlayingFrequencies] = useState<Set<number>>(new Set());

    return (
        <>
            <div className={style.Controls}>
                <SongSelector
                    songs={EXAMPLE_SONGS}
                    selectedSong={selectedSong}
                    onSelectSong={setSelectedSong}
                />
                <PlayerControls
                    song={selectedSong}
                    onPlayingFrequencies={setPlayingFrequencies}
                />
                <VolumeControl/>
            </div>
            <div className={style.ManualContainer}>
                <Manual layout="original" playingFrequencies={playingFrequencies} showVolume={false}/>
            </div>
        </>
    );
}

