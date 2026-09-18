import type {Song} from "../model/Song.ts";

const STORAGE_KEY = "harmonium_songs";
const CURRENT_SONG_KEY = "harmonium_current_song";

/**
 * Save a list of songs to localStorage
 */
export function saveSongs(songs: Song[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
    } catch (err) {
        console.error("Failed to save songs to localStorage:", err);
    }
}

/**
 * Load songs from localStorage
 */
export function loadSongs(): Song[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data) as Song[];
        }
    } catch (err) {
        console.error("Failed to load songs from localStorage:", err);
    }
    return [];
}

/**
 * Save the current song being edited to localStorage
 */
export function saveCurrentSong(song: Song): void {
    try {
        localStorage.setItem(CURRENT_SONG_KEY, JSON.stringify(song));
    } catch (err) {
        console.error("Failed to save current song to localStorage:", err);
    }
}

/**
 * Load the current song from localStorage
 */
export function loadCurrentSong(): Song | null {
    try {
        const data = localStorage.getItem(CURRENT_SONG_KEY);
        if (data) {
            return JSON.parse(data) as Song;
        }
    } catch (err) {
        console.error("Failed to load current song from localStorage:", err);
    }
    return null;
}

/**
 * Clear all saved songs and current song from localStorage
 */
export function clearStorage(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CURRENT_SONG_KEY);
    } catch (err) {
        console.error("Failed to clear storage:", err);
    }
}

/**
 * Add a song to the saved songs list
 */
export function addSongToLibrary(song: Song): void {
    const songs = loadSongs();
    // Avoid duplicates by title
    const filtered = songs.filter(s => s.title !== song.title);
    filtered.push(song);
    saveSongs(filtered);
}
