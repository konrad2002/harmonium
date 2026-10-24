import {FMSynth, PolySynth, now} from "tone";
import type {ToneEngine} from "./ToneEngine.ts";

// A single synth, created lazily. Creating one per render leaked audio nodes (each connected to
// the output) and overloaded the audio thread, causing crackling.
export class SynthEngine implements ToneEngine {
    private synth: PolySynth | null = null;
    private readonly held = new Set<number>();

    private get instance(): PolySynth {
        this.synth ??= new PolySynth(FMSynth, {
            harmonicity: 3,
            modulationIndex: 10,
            oscillator: {
                type: "sine"
            },
            // Sustains at full level for as long as the key is held, like a reed organ
            envelope: {
                attack: 0.02,
                decay: 0.1,
                sustain: 1.0,
                // Short, so that a note directly after one of the same pitch is not covered by its tail
                release: 0.1
            },
            modulation: {
                type: "sine"
            },
            modulationEnvelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.4
            }
        }).toDestination();

        return this.synth;
    }

    prepare(): Promise<void> {
        return Promise.resolve();
    }

    playTone(frequency: number): void {
        // A tone that is still held would just continue; release it so that the new one attacks again
        if (this.held.has(frequency)) this.instance.triggerRelease(frequency);

        this.held.add(frequency);
        this.instance.triggerAttack(frequency, now(), 1.2);
    }

    stopTone(frequency: number): void {
        this.held.delete(frequency);
        this.instance.triggerRelease(frequency);
    }

    stopAll(): void {
        this.held.clear();
        this.synth?.releaseAll();
    }
}
