import type {Song} from "../model/Song.ts";

// Example pre-programmed pieces for the harmonium.
// Frequencies are derived from standard musical notes for demonstration.

const C4 = 261.63;
const D4 = 293.66;
const E4 = 329.63;
const F4 = 349.23;
const G4 = 392.00;
const A4 = 440.00;
const B4 = 493.88;
const C5 = 523.25;

export const EXAMPLE_SONGS: Song[] = [
    {
        title: "Simple Melody",
        bpm: 120,
        notes: [
            // C D E C (1 beat each)
            {frequency: C4, time: 0, duration: 0.5, velocity: 1},
            {frequency: D4, time: 0.5, duration: 0.5, velocity: 1},
            {frequency: E4, time: 1, duration: 0.5, velocity: 1},
            {frequency: C4, time: 1.5, duration: 0.5, velocity: 1},
            // E F G (1 beat each)
            {frequency: E4, time: 2, duration: 0.5, velocity: 1},
            {frequency: F4, time: 2.5, duration: 0.5, velocity: 1},
            {frequency: G4, time: 3, duration: 1, velocity: 1},
            // G A B C (1 beat each)
            {frequency: G4, time: 4, duration: 0.5, velocity: 1},
            {frequency: A4, time: 4.5, duration: 0.5, velocity: 1},
            {frequency: B4, time: 5, duration: 0.5, velocity: 1},
            {frequency: C5, time: 5.5, duration: 1, velocity: 1},
        ],
    },
    {
        title: "Chord Progression",
        bpm: 90,
        notes: [
            // C major chord (C E G playing together)
            {frequency: C4, time: 0, duration: 1, velocity: 0.7},
            {frequency: E4, time: 0, duration: 1, velocity: 0.7},
            {frequency: G4, time: 0, duration: 1, velocity: 0.7},
            // F major chord (F A C)
            {frequency: F4, time: 1, duration: 1, velocity: 0.7},
            {frequency: A4, time: 1, duration: 1, velocity: 0.7},
            {frequency: C5, time: 1, duration: 1, velocity: 0.7},
            // G major chord (G B D)
            {frequency: G4, time: 2, duration: 1, velocity: 0.7},
            {frequency: B4, time: 2, duration: 1, velocity: 0.7},
            {frequency: D4, time: 2, duration: 1, velocity: 0.7},
            // C major chord (repeat)
            {frequency: C4, time: 3, duration: 1, velocity: 0.7},
            {frequency: E4, time: 3, duration: 1, velocity: 0.7},
            {frequency: G4, time: 3, duration: 1, velocity: 0.7},
        ],
    },
];
