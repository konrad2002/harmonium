import {useRef} from "react";
import {FMSynth, PolySynth} from "tone";

export default function useSynth(): PolySynth {
    const synth = useRef<PolySynth>(
        new PolySynth(FMSynth, {
            harmonicity: 3,
            modulationIndex: 10,
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.01,
                decay: 1.2,
                sustain: 0.0,
                release: 1.0
            },
            modulation: {
                type: "sine"
            },
            modulationEnvelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0
            }
        }).toDestination()
    );

    return synth.current;
}