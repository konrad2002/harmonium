import {useState, useCallback} from "react";
import type {Song, Note} from "../core/model/Song.ts";
import {
    addNoteToSong,
    removeNoteFromSong,
    updateNoteInSong,
    createNote,
} from "../core/helper/TimelineHelper.ts";

export interface TimelineEditorState {
    song: Song;
    selectedNoteIds: Set<string>;
    isRecording: boolean;
    loopEnabled: boolean;
    currentTime: number;
    zoom: number; // pixels per beat
}

export interface TimelineEditorActions {
    // Song management
    setSong: (song: Song) => void;
    updateSongBPM: (bpm: number) => void;
    updateSongTitle: (title: string) => void;

    // Note operations
    addNote: (note: Note) => void;
    deleteNote: (noteId: string) => void;
    deleteSelectedNotes: () => void;
    updateNote: (noteId: string, updates: Partial<Note>) => void;

    // Selection
    selectNote: (noteId: string, multi?: boolean) => void;
    deselectNote: (noteId: string) => void;
    clearSelection: () => void;
    selectAllNotes: () => void;

    // Recording
    setRecording: (recording: boolean) => void;
    recordKeyPress: (frequency: number, duration: number) => void;

    // Playback
    setCurrentTime: (time: number) => void;
    setLoop: (enabled: boolean, start?: number, end?: number) => void;

    // View
    setZoom: (zoom: number) => void;
}

/**
 * Hook for managing timeline editor state and operations
 */
export function useTimelineEditor(initialSong: Song): [TimelineEditorState, TimelineEditorActions] {
    const [song, setSongState] = useState<Song>(initialSong);
    const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
    const [isRecording, setRecordingState] = useState(false);
    const [loopEnabled, setLoopEnabled] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [zoom, setZoom] = useState(100); // pixels per beat

    // Create state object
    const state: TimelineEditorState = {
        song,
        selectedNoteIds,
        isRecording,
        loopEnabled,
        currentTime,
        zoom,
    };

    // Song management
    const setSong = useCallback((newSong: Song) => {
        setSongState(newSong);
    }, []);

    const updateSongBPM = useCallback((bpm: number) => {
        setSongState(prev => ({...prev, bpm}));
    }, []);

    const updateSongTitle = useCallback((title: string) => {
        setSongState(prev => ({...prev, title}));
    }, []);

    // Note operations
    const addNote = useCallback((note: Note) => {
        setSongState(prev => addNoteToSong(prev, note));
    }, []);

    const deleteNote = useCallback((noteId: string) => {
        setSongState(prev => removeNoteFromSong(prev, noteId));
        setSelectedNoteIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(noteId);
            return newSet;
        });
    }, []);

    const deleteSelectedNotes = useCallback(() => {
        setSongState(prev => {
            let result = prev;
            selectedNoteIds.forEach(id => {
                result = removeNoteFromSong(result, id);
            });
            return result;
        });
        setSelectedNoteIds(new Set());
    }, [selectedNoteIds]);

    const updateNote = useCallback((noteId: string, updates: Partial<Note>) => {
        setSongState(prev => updateNoteInSong(prev, noteId, updates));
    }, []);

    // Selection
    const selectNote = useCallback((noteId: string, multi = false) => {
        if (multi) {
            setSelectedNoteIds(prev => new Set(prev).add(noteId));
        } else {
            setSelectedNoteIds(new Set([noteId]));
        }
    }, []);

    const deselectNote = useCallback((noteId: string) => {
        setSelectedNoteIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(noteId);
            return newSet;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedNoteIds(new Set());
    }, []);

    const selectAllNotes = useCallback(() => {
        setSelectedNoteIds(new Set(song.notes.map(n => n.id)));
    }, [song.notes]);

    // Recording
    const setRecording = useCallback((recording: boolean) => {
        setRecordingState(recording);
        if (!recording) {
            // Optionally clear selection when stopping recording
        }
    }, []);

    const recordKeyPress = useCallback((frequency: number, duration: number = 0.5) => {
        if (!isRecording) return;
        const note = createNote(frequency, currentTime, duration, 0.8);
        addNote(note);
    }, [isRecording, currentTime, addNote]);

    // Playback
    const setCurrentTimeCallback = useCallback((time: number) => {
        setCurrentTime(time);
    }, []);

    const setLoop = useCallback((enabled: boolean, start?: number, end?: number) => {
        setLoopEnabled(enabled);
        setSongState(prev => ({
            ...prev,
            loopStart: start ?? prev.loopStart,
            loopEnd: end ?? prev.loopEnd,
        }));
    }, []);

    // View
    const setZoomCallback = useCallback((newZoom: number) => {
        setZoom(Math.max(10, Math.min(200, newZoom))); // Clamp between 10 and 200
    }, []);

    const actions: TimelineEditorActions = {
        setSong,
        updateSongBPM,
        updateSongTitle,
        addNote,
        deleteNote,
        deleteSelectedNotes,
        updateNote,
        selectNote,
        deselectNote,
        clearSelection,
        selectAllNotes,
        setRecording,
        recordKeyPress,
        setCurrentTime: setCurrentTimeCallback,
        setLoop,
        setZoom: setZoomCallback,
    };

    return [state, actions];
}
