import {ToneAudioBuffer, ToneBufferSource, now} from "tone";
import type {ToneEngine} from "./ToneEngine.ts";
import {getPlaybackRate, parseSampleConfig, validateSampleDuration, type SampleConfig} from "./SampleConfig.ts";

export const SAMPLE_CONFIG_URL = "/samples/harmonium.json";

// Short fade so that cutting a sound off doesn't click
const HARD_STOP_FADE = 0.03;

/**
 * Plays one recording at different pitches. A key press starts the file, which loops its hold
 * part while the key is down. Releasing turns the loop off, so the sound finishes the current
 * loop cycle and then runs on into the falling part of the file.
 */
export class SampleEngine implements ToneEngine {
    private config: SampleConfig | null = null;
    private buffer: AudioBuffer | null = null;
    private loading: Promise<void> | null = null;
    private readonly voices = new Map<number, ToneBufferSource>();

    prepare(): Promise<void> {
        this.loading ??= this.load().catch(error => {
            this.loading = null;
            throw error;
        });
        return this.loading;
    }

    private async load(): Promise<void> {
        const response = await fetch(SAMPLE_CONFIG_URL);
        if (!response.ok) {
            throw new Error(`Could not load ${SAMPLE_CONFIG_URL} (${response.status})`);
        }

        let raw: unknown;
        try {
            raw = await response.json();
        } catch {
            throw new Error(`${SAMPLE_CONFIG_URL} does not exist or is not valid JSON`);
        }
        const config = parseSampleConfig(raw, SAMPLE_CONFIG_URL);

        let audio: AudioBuffer;
        try {
            audio = (await ToneAudioBuffer.fromUrl(config.url)).get() as AudioBuffer;
        } catch {
            throw new Error(`Could not load the audio file ${config.url}`);
        }
        validateSampleDuration(config, audio.duration);

        this.config = config;
        this.buffer = audio;
    }

    playTone(frequency: number): void {
        const {config, buffer} = this;
        if (!config || !buffer) return;

        // Pressing a tone that is still sounding lets the old one fall while the new one rises
        this.release(frequency);

        const source = new ToneBufferSource({
            url: buffer,
            loop: true,
            loopStart: config.holdStart,
            loopEnd: config.holdEnd,
            playbackRate: getPlaybackRate(frequency, config),
            fadeOut: HARD_STOP_FADE,
            onended: () => {
                if (this.voices.get(frequency) === source) this.voices.delete(frequency);
                // Disposing inside Tone's own end handler is not safe
                setTimeout(() => source.dispose());
            },
        }).toDestination();

        // Looping sources start at the loop start by default; the rising part comes first
        source.start(now(), 0);
        this.voices.set(frequency, source);
    }

    stopTone(frequency: number): void {
        this.release(frequency);
    }

    stopAll(): void {
        for (const source of this.voices.values()) source.stop(now());
        this.voices.clear();
    }

    private release(frequency: number): void {
        const source = this.voices.get(frequency);
        if (!source) return;

        this.voices.delete(frequency);
        source.loop = false;
    }
}
