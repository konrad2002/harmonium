import ManualKey from "../ManualKey/ManualKey.tsx";
import style from "./Manual.module.scss";
import ManualKeySpacer from "../ManualKeySpacer/ManualKeySpacer.tsx";
import RegisterSelector from "../RegisterSelector/RegisterSelector.tsx";
import {useCallback, useEffect, useState} from "react";
import type {HarmoniumTone} from "../../../core/model/HarmoniumTone.ts";
import {parseCSV} from "../../../core/helper/CsvHelper.ts";
import useHarmoniumSynth from "../../../hooks/useHarmoniumSynth.ts";
import {useRegisterSelection} from "../../../hooks/useRegisterSelection.ts";
import {
    loadRegisters,
    generateDummyRegisterToneMapping,
    type Register,
} from "../../../core/data/RegisterConfiguration.ts";

type ManualProps = {
    layout: "original" | "compact";
    // Frequencies currently playing from song playback (to highlight keys)
    playingFrequencies?: Set<number>;
    // Callbacks for recording key presses
    onKeyDown?: (frequency: number) => void;
    onKeyUp?: (frequency: number) => void;
}

// Sequential computer-keyboard shortcuts for the first keys of the manual (by tone index).
const KEYBOARD_KEYS = "1234567890qwertyuiopasdfghjklzxcvbnm,./".split("");

export default function Manual({layout, playingFrequencies, onKeyDown, onKeyUp}: ManualProps) {
    const baseFrequency = 261.63;

    const {playTone, stopTone, setVolume} = useHarmoniumSynth();
    const [pressedFrequencies, setPressedFrequencies] = useState<Set<number>>(new Set());
    const [tones, setTones] = useState<HarmoniumTone[]>([{name: "-", cent: 0, frequency: 0, millioctave: 0}]);
    const [registers, setRegisters] = useState<Register[]>([]);
    
    const {
        toggleRegister,
        getActiveRegisterIds,
    } = useRegisterSelection(registers);

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

    function getColor(i: number, j: number): "red" | "blue" | "white" | "yellow" {
        return ["white", "blue", "yellow", "red"][((i % 3 == 0 ? 3 : 0) + j + 2 * i + ((i - (i % 3)) / 3)) % 4] as "red" | "blue" | "white" | "yellow";
    }

    // Load tones and registers
    useEffect(() => {
        // Load tones_min.csv - the reduced 64-tone set matching the 56-key manual layout
        fetch("/tones_min.csv")
            .then(res => res.text())
            .then(text => {
                const parsed = parseCSV(text, baseFrequency);
                parsed.forEach(p => {
                    p.name += " (" + p.frequency.toFixed(2) + " Hz)";
                });
                setTones(parsed);
                
                // Generate register tone mapping based on loaded tones (for future use)
                generateDummyRegisterToneMapping(parsed);
            });

        // Load registers configuration
        loadRegisters().then(setRegisters);
    }, []);

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

            // get tone from csv
            n++;

            const tone = tones[(n + tones.length - 7) % tones.length]

            row.push(
                <ManualKey
                    key={j}
                    keyColor={getColor(i, j)}
                    tone={tone}
                    pressed={pressedFrequencies.has(tone.frequency) || playingFrequencies?.has(tone.frequency) || false}
                    onMouseDown={() => press(tone.frequency)}
                    onMouseUp={() => release(tone.frequency)}
                    onMouseLeave={() => pressedFrequencies.has(tone.frequency) && release(tone.frequency)}
                    onTouchStart={(e) => {
                        e.preventDefault();
                        press(tone.frequency);
                    }}
                    onTouchEnd={(e) => {
                        e.preventDefault();
                        release(tone.frequency);
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
            <RegisterSelector
                registers={registers}
                activeRegisterIds={getActiveRegisterIds()}
                onToggleRegister={toggleRegister}
            />
            <div className={style.VolumeControl}>
                <label>
                    Volume
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
            <div className={style[layout]}>
                {buttons}
            </div>
        </>
    )
}