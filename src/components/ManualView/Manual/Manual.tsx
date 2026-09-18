import ManualKey from "../ManualKey/ManualKey.tsx";
import style from "./Manual.module.scss";
import ManualKeySpacer from "../ManualKeySpacer/ManualKeySpacer.tsx";
import {useCallback, useEffect, useState} from "react";
import type {HarmoniumTone} from "../../../core/model/HarmoniumTone.ts";
import {parseCSV} from "../../../core/helper/CsvHelper.ts";
import useHarmoniumSynth from "../../../hooks/useHarmoniumSynth.ts";

type ManualProps = {
    layout: "original" | "compact"
}

// Sequential computer-keyboard shortcuts for the first keys of the manual (by tone index).
const KEYBOARD_KEYS = "1234567890qwertyuiopasdfghjklzxcvbnm,./".split("");

export default function Manual({layout}: ManualProps) {
    const baseFrequency = 261.63;

    const {playTone, stopTone, setVolume} = useHarmoniumSynth();
    const [pressedFrequencies, setPressedFrequencies] = useState<Set<number>>(new Set());

    const press = useCallback((frequency: number) => {
        playTone(frequency);
        setPressedFrequencies(prev => new Set(prev).add(frequency));
    }, [playTone]);

    const release = useCallback((frequency: number) => {
        stopTone(frequency);
        setPressedFrequencies(prev => {
            const next = new Set(prev);
            next.delete(frequency);
            return next;
        });
    }, [stopTone]);

    function getColor(i: number, j: number): "red" | "blue" | "white" | "yellow" {
        return ["white", "blue", "yellow", "red"][((i % 3 == 0 ? 3 : 0) + j + 2 * i + ((i - (i % 3)) / 3)) % 4] as "red" | "blue" | "white" | "yellow";
    }

    const [tones, setTones] = useState<HarmoniumTone[]>([{name: "-", cent: 0, frequency: 0, millioctave: 0}]);

    useEffect(() => {
        // tones_min.csv is the reduced 64-tone set matching the 56-key manual layout below
        fetch("/tones_min.csv")
            .then(res => res.text())
            .then(text => {
                const parsed = parseCSV(text, baseFrequency);
                parsed.forEach(p => {
                    p.name += " (" + p.frequency.toFixed(2) + " Hz)";
                });
                setTones(parsed);
            });
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
                    pressed={pressedFrequencies.has(tone.frequency)}
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