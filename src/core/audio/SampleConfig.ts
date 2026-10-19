/**
 * Description of the recording used by the sample engine (public/samples/harmonium.json).
 *
 * One audio file holds the whole tone: a rising part, a sustained part and a falling part.
 * Playback loops the sustained part [holdStart, holdEnd] for as long as the key is held and
 * lets the file continue into the falling part when it is released. Everything before
 * `holdStart` is the rising sound, everything after `holdEnd` is the falling sound.
 */
export interface SampleConfig {
    // Resolved URL of the audio file
    url: string;
    // Frequency in Hz of the recorded tone
    frequency: number;
    // Seconds into the file
    holdStart: number;
    holdEnd: number;
}

function requirePositiveNumber(value: unknown, name: string): number {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        throw new Error(`"${name}" must be a positive number`);
    }
    return value;
}

function requireTime(value: unknown, name: string): number {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new Error(`"${name}" must be a time in seconds (0 or more)`);
    }
    return value;
}

/** Validates the parsed JSON and resolves the file name relative to the config's own URL. */
export function parseSampleConfig(raw: unknown, configUrl: string): SampleConfig {
    if (typeof raw !== "object" || raw === null) {
        throw new Error("Sample config must be a JSON object");
    }
    const {file, frequency, hold} = raw as Record<string, unknown>;

    if (typeof file !== "string" || file.trim() === "") {
        throw new Error('"file" must be the name of the audio file');
    }
    if (typeof hold !== "object" || hold === null) {
        throw new Error('"hold" must contain "start" and "end"');
    }

    const holdStart = requireTime((hold as Record<string, unknown>).start, "hold.start");
    const holdEnd = requireTime((hold as Record<string, unknown>).end, "hold.end");
    if (holdEnd <= holdStart) {
        throw new Error('"hold.end" must be after "hold.start"');
    }

    const isAbsolute = file.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(file);
    const url = isAbsolute ? file : configUrl.slice(0, configUrl.lastIndexOf("/") + 1) + file;

    return {url, frequency: requirePositiveNumber(frequency, "frequency"), holdStart, holdEnd};
}

/** The hold part has to lie inside the decoded audio. */
export function validateSampleDuration(config: SampleConfig, duration: number): void {
    if (config.holdEnd > duration) {
        throw new Error(`"hold.end" (${config.holdEnd}s) is beyond the end of the audio file (${duration.toFixed(2)}s)`);
    }
}

/** Playback speed that turns the recorded tone into `frequency`. */
export function getPlaybackRate(frequency: number, config: SampleConfig): number {
    return frequency / config.frequency;
}
