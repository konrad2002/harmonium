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
    // The latest voice per frequency; `held` is false once its key was released and it rings out
    private readonly voices = new Map<number, {source: ToneBufferSource; held: boolean}>();

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

        // The same tone again: fade out the previous one (also its release tail), otherwise the
        // new attack blends into it and repeated notes sound like one long note
        this.voices.get(frequency)?.source.stop(now());

        const source = new ToneBufferSource({
            url: buffer,
            loop: true,
            loopStart: config.holdStart,
            loopEnd: config.holdEnd,
            playbackRate: getPlaybackRate(frequency, config),
            fadeOut: HARD_STOP_FADE,
            onended: () => {
                if (this.voices.get(frequency) === voice) this.voices.delete(frequency);
                // Disposing inside Tone's own end handler is not safe
                setTimeout(() => source.dispose());
            },
        }).toDestination();
        const voice = {source, held: true};

        // Looping sources start at the loop start by default; the rising part comes first
        source.start(now(), 0);
        this.voices.set(frequency, voice);
    }

    stopTone(frequency: number): void {
        const voice = this.voices.get(frequency);
        if (!voice?.held) return;

        // Leave the loop: the sound finishes the cycle and runs into the falling part
        voice.held = false;
        voice.source.loop = false;
    }

    stopAll(): void {
        for (const {source} of this.voices.values()) source.stop(now());
        this.voices.clear();
    }
}
