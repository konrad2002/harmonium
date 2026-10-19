import {FMSynth, PolySynth, now} from "tone";
import type {ToneEngine} from "./ToneEngine.ts";

// A single synth, created lazily. Creating one per render leaked audio nodes (each connected to
// the output) and overloaded the audio thread, causing crackling.
export class SynthEngine implements ToneEngine {
    private synth: PolySynth | null = null;

    private get instance(): PolySynth {
        this.synth ??= new PolySynth(FMSynth, {
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
        }).toDestination();

        return this.synth;
    }

    prepare(): Promise<void> {
        return Promise.resolve();
    }

    playTone(frequency: number): void {
        this.instance.triggerAttack(frequency, now(), 1.2);
    }

    stopTone(frequency: number): void {
        this.instance.triggerRelease(frequency);
    }

    stopAll(): void {
        this.synth?.releaseAll();
    }
}
