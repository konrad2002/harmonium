import {Midi} from "@tonejs/midi";
import type {Song, Note} from "../model/Song.ts";
import {createNote, generateNoteId} from "./TimelineHelper.ts";

/**
 * MIDI note number to frequency (Hz) conversion
 * MIDI note 69 = A4 = 440 Hz
 */
export function midiNoteToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Frequency (Hz) to MIDI note number conversion
 * Returns the nearest MIDI note
 */
export function frequencyToMidiNote(frequency: number): number {
    return Math.round(69 + 12 * Math.log2(frequency / 440));
}

/**
 * Find the closest harmonium tone to a given frequency
 * @param frequency frequency in Hz to match
 * @param availableTones array of available harmonium tones
 * @returns the closest tone
 */
export function findClosestTone(
    frequency: number,
    availableTones: Array<{frequency: number; name: string}>
): {frequency: number; name: string} | null {
    if (availableTones.length === 0) return null;

    let closest = availableTones[0];
    let minDiff = Math.abs(frequency - closest.frequency);

    for (const tone of availableTones) {
        const diff = Math.abs(frequency - tone.frequency);
        if (diff < minDiff) {
            minDiff = diff;
            closest = tone;
        }
    }

    return closest;
}

/**
 * Convert a MIDI file to a Song
 * @param midiBuffer ArrayBuffer from a MIDI file
 * @param availableTones array of available harmonium tones for pitch mapping
 * @returns converted Song
 */
export function midiToSong(
    midiBuffer: ArrayBuffer,
    availableTones: Array<{frequency: number; name: string}>
): Song {
    const midi = new Midi(midiBuffer);

    // Get BPM from the MIDI file (default to 120)
    const bpm = midi.header.tempos.length > 0 ? Math.round(midi.header.tempos[0].bpm) : 120;

    const notes: Note[] = [];

    // Process all tracks
    midi.tracks.forEach(track => {
        track.notes.forEach(note => {
            // Convert MIDI note number to frequency
            const frequency = midiNoteToFrequency(note.midi);

            // Find the closest harmonium tone
            const harmoniumTone = findClosestTone(frequency, availableTones);

            if (harmoniumTone) {
                notes.push(
                    createNote(
                        harmoniumTone.frequency,
                        note.time, // time in seconds
                        note.duration, // duration in seconds
                        note.velocity // velocity [0, 1]
                    )
                );
            }
        });
    });

    // Sort notes by time
    notes.sort((a, b) => a.time - b.time);

    // Extract title from MIDI or use default
    const title = midi.header.name || "Imported MIDI";

    return {
        title,
        bpm,
        notes,
    };
}

/**
 * Convert a Song to a MIDI file
 * @param song the Song to export
 * @returns Midi object ready to save
 */
export function songToMidi(song: Song): Midi {
    const midi = new Midi();

    // Set header info
    midi.header.setTempo(song.bpm);
    midi.header.name = song.title;

    // Get or create a track
    const track = midi.addTrack();
    track.name = song.title;

    // Add notes to the track
    song.notes.forEach(note => {
        const midiNote = frequencyToMidiNote(note.frequency);

        // Clamp MIDI note to valid range (0-127)
        const clampedMidiNote = Math.max(0, Math.min(127, midiNote));

        track.addNote({
            midi: clampedMidiNote,
            time: note.time,
            duration: note.duration,
            velocity: note.velocity,
        });
    });

    return midi;
}

/**
 * Export a Song as a MIDI file download
 */
export function downloadSongAsMidi(song: Song): void {
    const midi = songToMidi(song);
    const dataUrl = "data:audio/midi;base64," + btoa(String.fromCharCode(...new Uint8Array(midi.toArray())));

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${song.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mid`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Export a Song as JSON download
 */
export function downloadSongAsJson(song: Song): void {
    const json = JSON.stringify(song, null, 2);
    const dataUrl = "data:application/json;base64," + btoa(json);

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${song.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Load a Song from a JSON file
 */
export function loadSongFromJson(file: File): Promise<Song> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => {
            try {
                const content = e.target?.result as string;
                const song = JSON.parse(content) as Song;

                // Ensure all notes have IDs
                const notesWithIds = song.notes.map(note =>
                    note.id ? note : {
                        ...note,
                        id: generateNoteId(),
                    }
                );

                resolve({
                    ...song,
                    notes: notesWithIds,
                });
            } catch (error) {
                reject(new Error(`Failed to parse JSON: ${error}`));
            }
        };

        reader.onerror = () => {
            reject(new Error("Failed to read file"));
        };

        reader.readAsText(file);
    });
}

/**
 * Load a Song from a MIDI file
 */
export function loadSongFromMidi(
    file: File,
    availableTones: Array<{frequency: number; name: string}>
): Promise<Song> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => {
            try {
                const buffer = e.target?.result as ArrayBuffer;
                const song = midiToSong(buffer, availableTones);
                resolve(song);
            } catch (error) {
                reject(new Error(`Failed to parse MIDI: ${error}`));
            }
        };

        reader.onerror = () => {
            reject(new Error("Failed to read file"));
        };

        reader.readAsArrayBuffer(file);
    });
}
