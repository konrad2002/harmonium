import ManualKey from "../ManualKey/ManualKey.tsx";
import style from "./Manual.module.scss";
import ManualKeySpacer from "../ManualKeySpacer/ManualKeySpacer.tsx";
import RegisterSelector from "../RegisterSelector/RegisterSelector.tsx";
import {useCallback, useEffect, useRef, useState, type ReactNode} from "react";
import useHarmoniumSynth from "../../../hooks/useHarmoniumSynth.ts";
import type {InstrumentTones} from "../../../hooks/useInstrumentTones.ts";
import {KEY_COLOURS} from "../../../core/data/ManualLayout.ts";
import Keyboard from "../../KeyboardView/Keyboard/Keyboard.tsx";
import {useI18n} from "../../../i18n.tsx";

type ManualProps = {
    layout: "original" | "compact" | "compose";
    // Tones and registers (see useInstrumentTones)
    instrument: InstrumentTones;
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
    // Show the register selector above the keys (default true)
    showRegisters?: boolean;
    // Show the frequency next to the tone name on the keys (default true)
    showFrequencies?: boolean;
    // Fill the height of a flex column parent: the topSlot gets 60% and the keys 40% of the space
    // left over by the piano reference. The topSlot has to take part in that flex layout.
    fill?: boolean;
}

// Computer keys that play the first keys of the manual (left to right, column by column).
const KEYBOARD_KEYS = "1234567890qwertyuiopasdfghjklzxcvbnm,./".split("");

export default function Manual({layout, instrument, activeKeys, selectionMode = false, selectedKey = null, onSelectKey, topSlot, onKeyDown, onKeyUp, showVolume = true, showRegisters = true, showFrequencies = true, fill = false}: ManualProps) {
    const {registers, activeRegisterIds, toggleRegister, keyTones} = instrument;
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

    // Held computer keys by physical key (e.code): a release must find the note that its press
    // started, even when Shift/Caps Lock changed the character (e.key) in between.
    const heldKeysRef = useRef(new Map<string, number>());

    // Play the first manual keys via the computer keyboard, with their register tones.
    useEffect(() => {
        const held = heldKeysRef.current;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.repeat || held.has(e.code) || e.metaKey || e.ctrlKey || e.altKey) return;
            const index = KEYBOARD_KEYS.indexOf(e.key.toLowerCase());
            const tone = index === -1 ? null : keyTones[index];
            if (!tone) return;

            held.set(e.code, tone.frequency);
            press(tone.frequency);
        }

        function handleKeyUp(e: KeyboardEvent) {
            const frequency = held.get(e.code);
            if (frequency === undefined) return;

            held.delete(e.code);
            release(frequency);
        }

        // keyup is not delivered after the window lost focus
        function releaseAll() {
            for (const frequency of held.values()) release(frequency);
            held.clear();
        }

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", releaseAll);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("blur", releaseAll);
        };
    }, [keyTones, press, release]);

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
                    showFrequency={showFrequencies}
                    pressed={(!!tone && pressedFrequencies.has(tone.frequency)) || activeKeys?.has(keyIndex) || false}
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
            {showRegisters && (
                <RegisterSelector
                    registers={registers}
                    activeRegisterIds={activeRegisterIds}
                    onToggleRegister={toggleRegister}
                />
            )}
            <div className={`${style.Scroller} ${fill ? style.ScrollerFill : ""}`}>
                <div className={`${style[layout]} ${fill ? style.InnerFill : ""}`}>
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