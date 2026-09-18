import {useState} from "react";
import style from "./PlayView.module.scss";
import keysTopImage from "../../../assets/pictures/keys_top.jpg";
import Keyboard from "../../KeyboardView/Keyboard/Keyboard.tsx";
import Manual from "../../ManualView/Manual/Manual.tsx";
import SongSelector from "../../Player/SongSelector/SongSelector.tsx";
import PlayerControls from "../../Player/PlayerControls/PlayerControls.tsx";
import {EXAMPLE_SONGS} from "../../../core/data/ExampleSongs.ts";
import type {Song} from "../../../core/model/Song.ts";

export default function PlayView() {
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [playingFrequencies, setPlayingFrequencies] = useState<Set<number>>(new Set());

    return (
        <>
            <SongSelector
                songs={EXAMPLE_SONGS}
                selectedSong={selectedSong}
                onSelectSong={setSelectedSong}
            />
            <PlayerControls
                song={selectedSong}
                onPlayingFrequencies={setPlayingFrequencies}
            />
            <div className={style.ManualContainer}>
                <Keyboard/>
                <Manual layout="original" playingFrequencies={playingFrequencies}/>
                <hr/>
                <Manual layout="compact" playingFrequencies={playingFrequencies}/>
            </div>
            <hr/>
            <h2>Picture</h2>
            <img src={keysTopImage} alt="image of keys"/>
        </>
    );
}

