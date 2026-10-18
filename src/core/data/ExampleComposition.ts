import {getKeyIndex} from "./ManualLayout.ts";
import type {ComposeNote} from "../model/ComposeNote.ts";

// [column, slot in column, start (s), duration (s)]
const EXAMPLE_NOTES: [number, number, number, number][] = [
    // Slow bass note held throughout the first half
    [6, 1, 0, 4],

    // Rising line
    [12, 1, 0, 0.5],
    [14, 2, 0.5, 0.5],
    [16, 0, 1, 0.5],
    [18, 3, 1.5, 0.5],

    // Chord
    [20, 1, 2, 1.5],
    [24, 2, 2, 1.5],
    [28, 0, 2, 1.5],

    // Two keys of the same column sounding together (shares the column width)
    [20, 3, 2.5, 1],

    // Falling line
    [26, 1, 4, 0.5],
    [23, 2, 4.5, 0.5],
    [19, 0, 5, 0.5],
    [15, 3, 5.5, 0.5],

    // Wide chord across all four colours
    [8, 2, 6.5, 2],
    [17, 1, 6.5, 2],
    [30, 3, 6.5, 2],
    [41, 0, 6.5, 2],

    // Quick repeated notes
    [34, 1, 9, 0.25],
    [34, 1, 9.5, 0.25],
    [34, 1, 10, 0.25],
    [36, 2, 10.5, 0.25],
    [38, 0, 11, 1],
];

export const EXAMPLE_COMPOSITION: ComposeNote[] = EXAMPLE_NOTES.map(([column, slot, start, duration], i) => ({
    id: `example-${i}`,
    key: getKeyIndex(column, slot),
    start,
    duration,
}));
