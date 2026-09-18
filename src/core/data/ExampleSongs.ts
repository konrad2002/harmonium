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
            {id: "note_0", frequency: C4, time: 0, duration: 0.5, velocity: 1},
            {id: "note_1", frequency: D4, time: 0.5, duration: 0.5, velocity: 1},
            {id: "note_2", frequency: E4, time: 1, duration: 0.5, velocity: 1},
            {id: "note_3", frequency: C4, time: 1.5, duration: 0.5, velocity: 1},
            // E F G (1 beat each)
            {id: "note_4", frequency: E4, time: 2, duration: 0.5, velocity: 1},
            {id: "note_5", frequency: F4, time: 2.5, duration: 0.5, velocity: 1},
            {id: "note_6", frequency: G4, time: 3, duration: 1, velocity: 1},
            // G A B C (1 beat each)
            {id: "note_7", frequency: G4, time: 4, duration: 0.5, velocity: 1},
            {id: "note_8", frequency: A4, time: 4.5, duration: 0.5, velocity: 1},
            {id: "note_9", frequency: B4, time: 5, duration: 0.5, velocity: 1},
            {id: "note_10", frequency: C5, time: 5.5, duration: 1, velocity: 1},
        ],
    },
    {
        title: "Chord Progression",
        bpm: 90,
        notes: [
            // C major chord (C E G playing together)
            {id: "chord_0_c", frequency: C4, time: 0, duration: 1, velocity: 0.7},
            {id: "chord_0_e", frequency: E4, time: 0, duration: 1, velocity: 0.7},
            {id: "chord_0_g", frequency: G4, time: 0, duration: 1, velocity: 0.7},
            // F major chord (F A C)
            {id: "chord_1_f", frequency: F4, time: 1, duration: 1, velocity: 0.7},
            {id: "chord_1_a", frequency: A4, time: 1, duration: 1, velocity: 0.7},
            {id: "chord_1_c", frequency: C5, time: 1, duration: 1, velocity: 0.7},
            // G major chord (G B D)
            {id: "chord_2_g", frequency: G4, time: 2, duration: 1, velocity: 0.7},
            {id: "chord_2_b", frequency: B4, time: 2, duration: 1, velocity: 0.7},
            {id: "chord_2_d", frequency: D4, time: 2, duration: 1, velocity: 0.7},
            // C major chord (repeat)
            {id: "chord_3_c", frequency: C4, time: 3, duration: 1, velocity: 0.7},
            {id: "chord_3_e", frequency: E4, time: 3, duration: 1, velocity: 0.7},
            {id: "chord_3_g", frequency: G4, time: 3, duration: 1, velocity: 0.7},
        ],
    },
];
