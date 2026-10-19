import {describe, it, expect} from "vitest";
import {getPlaybackRate, parseSampleConfig, validateSampleDuration} from "./SampleConfig.ts";

const CONFIG_URL = "/samples/harmonium.json";
const valid = {file: "harmonium.wav", frequency: 220, hold: {start: 0.4, end: 1.2}};

describe("parseSampleConfig", () => {
    it("reads the recording description", () => {
        expect(parseSampleConfig(valid, CONFIG_URL)).toEqual({
            url: "/samples/harmonium.wav",
            frequency: 220,
            holdStart: 0.4,
            holdEnd: 1.2,
        });
    });

    it("resolves the file relative to the config, unless it is absolute", () => {
        expect(parseSampleConfig({...valid, file: "/audio/a.wav"}, CONFIG_URL).url).toBe("/audio/a.wav");
        expect(parseSampleConfig({...valid, file: "https://example.com/a.wav"}, CONFIG_URL).url)
            .toBe("https://example.com/a.wav");
        expect(parseSampleConfig({...valid, file: "sub/a.wav"}, CONFIG_URL).url).toBe("/samples/sub/a.wav");
    });

    it("rejects invalid descriptions with a readable message", () => {
        expect(() => parseSampleConfig(null, CONFIG_URL)).toThrow("JSON object");
        expect(() => parseSampleConfig({...valid, file: ""}, CONFIG_URL)).toThrow('"file"');
        expect(() => parseSampleConfig({...valid, frequency: 0}, CONFIG_URL)).toThrow('"frequency"');
        expect(() => parseSampleConfig({...valid, hold: undefined}, CONFIG_URL)).toThrow('"hold"');
        expect(() => parseSampleConfig({...valid, hold: {start: -1, end: 1}}, CONFIG_URL)).toThrow('"hold.start"');
        expect(() => parseSampleConfig({...valid, hold: {start: 1}}, CONFIG_URL)).toThrow('"hold.end"');
        expect(() => parseSampleConfig({...valid, hold: {start: 1, end: 1}}, CONFIG_URL)).toThrow("after");
    });
});

describe("validateSampleDuration", () => {
    const config = parseSampleConfig(valid, CONFIG_URL);

    it("accepts a hold part inside the audio", () => {
        expect(() => validateSampleDuration(config, 2)).not.toThrow();
        expect(() => validateSampleDuration(config, 1.2)).not.toThrow();
    });

    it("rejects a hold part beyond the audio", () => {
        expect(() => validateSampleDuration(config, 1)).toThrow("beyond");
    });
});

describe("getPlaybackRate", () => {
    const config = parseSampleConfig(valid, CONFIG_URL);

    it("is 1 for the recorded frequency and doubles per octave", () => {
        expect(getPlaybackRate(220, config)).toBe(1);
        expect(getPlaybackRate(440, config)).toBe(2);
        expect(getPlaybackRate(110, config)).toBe(0.5);
    });
});
