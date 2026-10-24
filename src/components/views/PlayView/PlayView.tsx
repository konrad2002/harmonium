import {useCallback, useMemo, useRef, useState} from "react";
import style from "./PlayView.module.scss";
import Manual from "../../ManualView/Manual/Manual.tsx";
import KeyboardSetup from "../../ManualView/KeyboardSetup/KeyboardSetup.tsx";
import PlayerControls from "../../Player/PlayerControls/PlayerControls.tsx";
import VolumeControl from "../../Player/VolumeControl/VolumeControl.tsx";
import SoundSelector from "../../Player/SoundSelector/SoundSelector.tsx";
import {useInstrumentTones} from "../../../hooks/useInstrumentTones.ts";
import {useComposition} from "../../../hooks/useComposition.ts";
import {useKeyboardSetup} from "../../../hooks/useKeyboardSetup.ts";
import useTimelinePlayer from "../../../hooks/useTimelinePlayer.ts";
import useKeySounding from "../../../hooks/useKeySounding.ts";
import {getCompositionDuration} from "../../../core/helper/ComposeTimelineHelper.ts";
import {OCTAVE_WINDOW, slotForKey} from "../../../core/data/KeyboardMapping.ts";
import {useI18n} from "../../../i18n.tsx";

/** Plays the composition made in the Compose view, with the sounding keys lit up. */
export default function PlayView() {
    const {t} = useI18n();
    const instrument = useInstrumentTones();
    const [notes] = useComposition();
    const {octave, assign} = useKeyboardSetup();

    // Keyboard setup: choosing a computer key, then a manual key, assigns it
    const [setupOpen, setSetupOpen] = useState(false);
    const [assigningCode, setAssigningCode] = useState<string | null>(null);
    const [setupMessage, setSetupMessage] = useState<string | null>(null);

    const assignKey = useCallback((keyIndex: number) => {
        if (!assigningCode) return;

        const slot = slotForKey(keyIndex, octave, instrument.keyTones);
        if (!slot) {
            setSetupMessage(t("keyboard.outOfRange", {first: octave, last: octave + OCTAVE_WINDOW - 1}));
            return;
        }

        assign(assigningCode, slot);
        setAssigningCode(null);
        setSetupMessage(null);
    }, [assigningCode, octave, instrument.keyTones, assign, t]);

    const changeAssigning = useCallback((code: string | null) => {
        setAssigningCode(code);
        setSetupMessage(null);
    }, []);

    const toggleSetup = useCallback(() => {
        setSetupOpen(open => !open);
        changeAssigning(null);
    }, [changeAssigning]);

    const duration = useMemo(() => getCompositionDuration(notes), [notes]);
    // There is no timeline to scroll here; the player only keeps the time
    const scrollRef = useRef<HTMLDivElement>(null);
    const player = useTimelinePlayer({notes, duration, pixelsPerSecond: 1, scrollRef});

    useKeySounding(notes, player.activeNoteIds, instrument.keyTones);

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
                <button type="button" className={style.Button} onClick={toggleSetup} aria-pressed={setupOpen}>
                    {t("keyboard.setup")}
                </button>
                {duration <= 0 && <div className={style.Hint}>{t("play.empty")}</div>}
            </div>
            {setupOpen && (
                <KeyboardSetup
                    keyTones={instrument.keyTones}
                    assigningCode={assigningCode}
                    onAssigningChange={changeAssigning}
                    message={setupMessage}
                />
            )}
            <Manual
                layout="original"
                instrument={instrument}
                activeKeys={player.activeKeys}
                selectionMode={assigningCode !== null}
                onSelectKey={assignKey}
                showVolume={false}
            />
        </>
    );
}

