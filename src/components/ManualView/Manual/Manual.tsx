import ManualKey from "../ManualKey/ManualKey.tsx";
import style from "./Manual.module.scss";
import ManualKeySpacer from "../ManualKeySpacer/ManualKeySpacer.tsx";
import {useEffect, useRef, useState} from "react";
import type {HarmoniumTone} from "../../../core/model/HarmoniumTone.ts";
import {parseCSV} from "../../../core/helper/CsvHelper.ts";
import useSynth from "../../../hooks/useSynth.ts";
import {now} from "tone";

type ManualProps = {
    layout: "original" | "compact"
}

export default function Manual({layout}: ManualProps) {
    const baseFrequency = 261.63;

    const synthRef = useRef(useSynth());

    function getColor(i: number, j: number): "red" | "blue" | "white" | "yellow" {
        return ["white", "blue", "yellow", "red"][((i % 3 == 0 ? 3 : 0) + j + 2 * i + ((i - (i % 3)) / 3)) % 4] as "red" | "blue" | "white" | "yellow";
    }

    function playToneFrequencySynth(frequency: number) {
        synthRef.current.triggerAttack(frequency, now(), 1.2);
    }

    function stopToneFrequencySynth(frequency: number) {
        synthRef.current.triggerRelease(frequency);
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
                    onMouseDown={() => playToneFrequencySynth(tone.frequency)}
                    onMouseUp={() => stopToneFrequencySynth(tone.frequency)}
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
            <div className={style[layout]}>
                {buttons}
            </div>
        </>
    )
}