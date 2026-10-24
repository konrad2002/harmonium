import {useMemo, useRef} from "react";
import style from "./PlayView.module.scss";
import Manual from "../../ManualView/Manual/Manual.tsx";
import PlayerControls from "../../Player/PlayerControls/PlayerControls.tsx";
import VolumeControl from "../../Player/VolumeControl/VolumeControl.tsx";
import SoundSelector from "../../Player/SoundSelector/SoundSelector.tsx";
import {useInstrumentTones} from "../../../hooks/useInstrumentTones.ts";
import {useComposition} from "../../../hooks/useComposition.ts";
import useTimelinePlayer from "../../../hooks/useTimelinePlayer.ts";
import useKeySounding from "../../../hooks/useKeySounding.ts";
import {getCompositionDuration} from "../../../core/helper/ComposeTimelineHelper.ts";
import {useI18n} from "../../../i18n.tsx";

/** Plays the composition made in the Compose view, with the sounding keys lit up. */
export default function PlayView() {
    const {t} = useI18n();
    const instrument = useInstrumentTones();
    const [notes] = useComposition();

    const duration = useMemo(() => getCompositionDuration(notes), [notes]);
    // There is no timeline to scroll here; the player only keeps the time
    const scrollRef = useRef<HTMLDivElement>(null);
    const player = useTimelinePlayer({notes, duration, pixelsPerSecond: 1, scrollRef});

    useKeySounding(player.activeKeys, instrument.keyTones);

    return (
        <>
            <div className={style.Controls}>
                <PlayerControls
                    state={player.state}
                    currentTime={player.currentTime}
                    duration={duration}
                    onPlay={player.play}
                    onPause={player.pause}
                    onStop={player.stop}
                    onSeek={player.seek}
                />
                <VolumeControl/>
                <SoundSelector/>
                {duration <= 0 && <div className={style.Hint}>{t("play.empty")}</div>}
            </div>
            <Manual layout="original" instrument={instrument} activeKeys={player.activeKeys} showVolume={false}/>
        </>
    );
}

