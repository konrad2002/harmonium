import ManualKey from "../ManualKey/ManualKey.tsx";
import style from "./Manual.module.scss";
import ManualKeySpacer from "../ManualKeySpacer/ManualKeySpacer.tsx";
import RegisterSelector from "../RegisterSelector/RegisterSelector.tsx";
import {useCallback, useEffect, useState, type ReactNode} from "react";
import useHarmoniumSynth from "../../../hooks/useHarmoniumSynth.ts";
import type {InstrumentTones} from "../../../hooks/useInstrumentTones.ts";
import {KEY_COLOURS} from "../../../core/data/ManualLayout.ts";
import Keyboard from "../../KeyboardView/Keyboard/Keyboard.tsx";
import {useI18n} from "../../../i18n.tsx";

type ManualProps = {
    layout: "original" | "compact" | "compose";
    // Tones and registers (see useInstrumentTones)
    instrument: InstrumentTones;
    // Frequencies currently playing from song playback (to highlight keys)
    playingFrequencies?: Set<number>;
    // Keys (by index) to show as pressed, e.g. while a timeline plays
    activeKeys?: ReadonlySet<number>;
    // Selection mode: pressing a key also selects it (for editing) instead of only playing it
    selectionMode?: boolean;
    selectedKey?: number | null;
    onSelectKey?: (keyIndex: number) => void;
    // Rendered inside the horizontally scrolling area, above the piano reference
    topSlot?: ReactNode;
    // Callbacks for recording key presses
    onKeyDown?: (frequency: number) => void;
    onKeyUp?: (frequency: number) => void;
    // Show the manual's own volume slider (default true)
    showVolume?: boolean;
}

// Sequential computer-keyboard shortcuts for the first keys of the manual (by tone index).
const KEYBOARD_KEYS = "1234567890qwertyuiopasdfghjklzxcvbnm,./".split("");

export default function Manual({layout, instrument, playingFrequencies, activeKeys, selectionMode = false, selectedKey = null, onSelectKey, topSlot, onKeyDown, onKeyUp, showVolume = true}: ManualProps) {
    const {tones, registers, activeRegisterIds, toggleRegister, keyTones} = instrument;
    const {t} = useI18n();

    const {playTone, stopTone, setVolume} = useHarmoniumSynth();
    const [pressedFrequencies, setPressedFrequencies] = useState<Set<number>>(new Set());

    const press = useCallback((frequency: number) => {
        playTone(frequency);
        onKeyDown?.(frequency);
        setPressedFrequencies(prev => new Set(prev).add(frequency));
    }, [playTone, onKeyDown]);

    const release = useCallback((frequency: number) => {
        stopTone(frequency);
        onKeyUp?.(frequency);
        setPressedFrequencies(prev => {
            const next = new Set(prev);
            next.delete(frequency);
            return next;
        });
    }, [stopTone, onKeyUp]);

    // Play the first tones via the computer keyboard (only covers a subset of all manual keys).
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.repeat) return;
            const index = KEYBOARD_KEYS.indexOf(e.key);
            if (index === -1 || index >= tones.length) return;
            press(tones[index].frequency);
        }

        function handleKeyUp(e: KeyboardEvent) {
            const index = KEYBOARD_KEYS.indexOf(e.key);
            if (index === -1 || index >= tones.length) return;
            release(tones[index].frequency);
        }

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [tones, press, release]);

    const buttons = [];

    let n = -1;
    for (let i = 0; i < 56; i++) {
        const row = [];

        row.push(<ManualKeySpacer size={[1, 3, 2][i % 3] as 1 | 2 | 3}/>);

        for (let j = 0; j < (i % 3 === 0 ? 5 : 4); j++) {
            // color patter:
            // R W B G R G R W B W B G R G R W B G B G R W R W B G B G R W B W B G R G R W B

            n++;
            const colour = KEY_COLOURS[n];
            const keyIndex = n;

            // Null when no register is active for this colour (or it has no tones configured yet):
            // the key is then unassigned, showing no label and playing no sound.
            const tone = keyTones[keyIndex];

            row.push(
                <ManualKey
                    key={j}
                    keyColor={colour}
                    tone={tone}
                    selected={selectionMode && selectedKey === keyIndex}
                    pressed={(!!tone && (pressedFrequencies.has(tone.frequency) || playingFrequencies?.has(tone.frequency))) || activeKeys?.has(keyIndex) || false}
                    onMouseDown={() => {
                        if (!tone) return;
                        if (selectionMode) onSelectKey?.(keyIndex);
                        press(tone.frequency);
                    }}
                    onMouseUp={() => tone && release(tone.frequency)}
                    onMouseLeave={() => tone && pressedFrequencies.has(tone.frequency) && release(tone.frequency)}
                    onTouchStart={() => {
                        if (!tone) return;
                        if (selectionMode) onSelectKey?.(keyIndex);
                        press(tone.frequency);
                    }}
                    onTouchEnd={(e) => {
                        // Suppress emulated mouse events that would retrigger the note
                        e.preventDefault();
                        if (tone) release(tone.frequency);
                    }}
                    // Fired when the browser takes over the touch to scroll the instrument
                    onTouchCancel={() => {
                        if (tone) release(tone.frequency);
                    }}
                />
            );
        }

        row.push(<ManualKeySpacer size={[1, 2, 3][i % 3] as 1 | 2 | 3}/>);

        buttons.push(
            <div
                className={`${style.ManualKeyRow} ${style[`ManualRow` + ([1, 3, 6, 8, 10].includes((i + 5) % 12) ? 1 : 2)]}`}
                key={i}>
                {row}
            </div>
        );
    }

    return (
        <>
            {showVolume && (
                <div className={style.VolumeControl}>
                    <label>
                        {t("volume.label")}
                        <input
                            type="range"
                            min={-40}
                            max={6}
                            defaultValue={0}
                            step={1}
                            onChange={(e) => setVolume(Number(e.target.value))}
                        />
                    </label>
                </div>
            )}
            <RegisterSelector
                registers={registers}
                activeRegisterIds={activeRegisterIds}
                onToggleRegister={toggleRegister}
            />
            <div className={style.Scroller}>
                <div className={style[layout]}>
                    {topSlot}
                    <Keyboard/>
                    <div className={style.Keys}>
                        {buttons}
                    </div>
                </div>
            </div>
        </>
    )
}