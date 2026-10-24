import {describe, it, expect} from "vitest";
import {ProjectFormatError, parseProject, serializeProject, type ProjectState} from "./ProjectFile.ts";
import {defaultSetup} from "../data/KeyboardMapping.ts";
import {defaultRegisterSelection, parseRegisterSelection} from "../data/RegisterSelection.ts";
import type {Register} from "../data/RegisterConfiguration.ts";

const registers: Register[] = [
    {id: 1, register: "I", label: "a", colour: "red", active: false, tones: [], first_tone: 0},
    {id: 5, register: "V", label: "b", colour: "red", active: true, tones: [], first_tone: 0},
    {id: 4, register: "IV", label: "c", colour: "yellow", active: true, tones: [], first_tone: 0},
];

const state: ProjectState = {
    composition: [{id: "a", key: 3, start: 0.5, duration: 0.25}],
    keyboard: {...defaultSetup(), octave: 3},
    registers: {red: 1},
    soundEngine: "sample",
};

describe("project file", () => {
    it("round trips the whole state", () => {
        expect(parseProject(serializeProject(state), registers)).toEqual(state);
    });

    it("labels the file and records when it was saved", () => {
        const file = JSON.parse(serializeProject(state, new Date("2026-01-02T03:04:05Z")));
        expect(file).toMatchObject({format: "harmonium-project", version: 1, savedAt: "2026-01-02T03:04:05.000Z"});
    });

    it("leaves out sections that are missing", () => {
        const text = JSON.stringify({format: "harmonium-project", version: 1, soundEngine: "synth"});
        expect(parseProject(text, registers)).toEqual({soundEngine: "synth"});
    });

    it("accepts an empty register selection (all registers pushed in)", () => {
        const text = JSON.stringify({format: "harmonium-project", version: 1, registers: {}});
        expect(parseProject(text, registers)).toEqual({registers: {}});
    });

    it("rejects files that are not project files", () => {
        expect(() => parseProject("nope", registers)).toThrow(ProjectFormatError);
        expect(() => parseProject("[]", registers)).toThrow("not a Harmonium project");
        expect(() => parseProject(JSON.stringify({format: "other", version: 1}), registers)).toThrow("not a Harmonium project");
        expect(() => parseProject(JSON.stringify({format: "harmonium-project", version: 2, soundEngine: "synth"}), registers)).toThrow("newer");
        expect(() => parseProject(JSON.stringify({format: "harmonium-project", version: 1}), registers)).toThrow("no data");
    });

    it("rejects invalid sections instead of loading part of the file", () => {
        const file = {format: "harmonium-project", version: 1};
        const bad = (section: object) => () => parseProject(JSON.stringify({...file, ...section}), registers);

        expect(bad({composition: [{id: "a"}]})).toThrow("composition");
        expect(bad({keyboard: {octave: 99, mapping: {}}})).toThrow("keyboard");
        expect(bad({registers: {red: 4}})).toThrow("registers");
        expect(bad({registers: {green: 1}})).toThrow("registers");
        expect(bad({soundEngine: "radio"})).toThrow("sound");
    });
});

describe("register selection", () => {
    it("defaults to the registers marked active", () => {
        expect(defaultRegisterSelection(registers)).toEqual({red: 5, yellow: 4});
    });

    it("only accepts existing registers of the right colour when checked against them", () => {
        expect(parseRegisterSelection({red: 1}, registers)).toEqual({red: 1});
        expect(parseRegisterSelection({red: 4}, registers)).toBeNull();
        expect(parseRegisterSelection({red: 99}, registers)).toBeNull();
        expect(parseRegisterSelection({red: 99})).toEqual({red: 99});
        expect(parseRegisterSelection([1])).toBeNull();
    });
});
