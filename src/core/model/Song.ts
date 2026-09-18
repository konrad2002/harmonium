// Internal song representation, independent of MIDI format.
// This allows for flexible note scheduling and playback via tone.js Transport.

export interface Note {
    // Unique identifier for note tracking (e.g., for deletion, selection, recording)
    id: string;
    // Frequency in Hz (from HarmoniumTone)
    frequency: number;
    // Time in seconds from the start of the song
    time: number;
    // Duration in seconds
    duration: number;
    // Velocity / amplitude [0, 1]
    velocity: number;
}

export interface Song {
    // Human-readable title
    title: string;
    // Tempo in beats per minute (used as reference; playback uses absolute seconds)
    bpm: number;
    // Array of notes to play
    notes: Note[];
    // Optional: loop start time in seconds (null if not set)
    loopStart?: number | null;
    // Optional: loop end time in seconds (null if not set)
    loopEnd?: number | null;
}
