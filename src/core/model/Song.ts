// Internal song representation, independent of MIDI format.
// This allows for flexible note scheduling and playback via tone.js Transport.

export interface Note {
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
}
