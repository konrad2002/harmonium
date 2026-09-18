import type {Song, Note} from "../model/Song.ts";

/**
 * Generate a unique ID for a note (using timestamp + random)
 */
export function generateNoteId(): string {
    return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate the total duration of a song in seconds
 * based on the longest note's end time (time + duration)
 */
export function calculateSongDuration(song: Song): number {
    if (song.notes.length === 0) return 0;
    const lastNote = song.notes.reduce((max, note) => {
        const endTime = note.time + note.duration;
        const maxEndTime = max.time + max.duration;
        return endTime > maxEndTime ? note : max;
    });
    return lastNote.time + lastNote.duration;
}

/**
 * Convert time in seconds to beats based on BPM
 * @param seconds time in seconds
 * @param bpm beats per minute
 * @returns time in beats
 */
export function secondsToBeats(seconds: number, bpm: number): number {
    const beatsPerSecond = bpm / 60;
    return seconds * beatsPerSecond;
}

/**
 * Convert beats to seconds based on BPM
 * @param beats time in beats
 * @param bpm beats per minute
 * @returns time in seconds
 */
export function beatsToSeconds(beats: number, bpm: number): number {
    const secondsPerBeat = 60 / bpm;
    return beats * secondsPerBeat;
}

/**
 * Format time in seconds to MM:SS display
 */
export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${minutes}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

/**
 * Snap a time value to the nearest beat
 */
export function snapToGrid(time: number, bpm: number, gridSize: number = 16): number {
    const beatDuration = 60 / bpm;
    const gridDuration = beatDuration / gridSize; // e.g., 1/16 beat
    return Math.round(time / gridDuration) * gridDuration;
}

/**
 * Create a new note with the given parameters
 */
export function createNote(
    frequency: number,
    time: number,
    duration: number = 0.5,
    velocity: number = 0.8
): Note {
    return {
        id: generateNoteId(),
        frequency,
        time,
        duration,
        velocity,
    };
}

/**
 * Add a note to a song, maintaining time-sorted order
 */
export function addNoteToSong(song: Song, note: Note): Song {
    const newNotes = [...song.notes, note].sort((a, b) => a.time - b.time);
    return {
        ...song,
        notes: newNotes,
    };
}

/**
 * Remove a note from a song by ID
 */
export function removeNoteFromSong(song: Song, noteId: string): Song {
    return {
        ...song,
        notes: song.notes.filter(n => n.id !== noteId),
    };
}

/**
 * Update a note in a song by ID
 */
export function updateNoteInSong(song: Song, noteId: string, updates: Partial<Note>): Song {
    return {
        ...song,
        notes: song.notes.map(n =>
            n.id === noteId ? {
                ...n,
                ...updates,
                id: n.id, // Preserve original ID
            } : n
        ),
    };
}
