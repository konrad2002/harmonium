import {useMemo, useState} from "react";
import style from "./Timeline.module.scss";
import TimelineRuler from "../TimelineRuler/TimelineRuler.tsx";
import TimelineNote from "../TimelineNote/TimelineNote.tsx";
import {createNote, calculateSongDuration} from "../../../core/helper/TimelineHelper.ts";
import type {Song, Note} from "../../../core/model/Song.ts";

interface TimelineProps {
    song: Song;
    allTones: Array<{frequency: number; name: string}>;
    selectedNoteIds: Set<string>;
    playingFrequencies?: Set<number>;
    currentTime?: number;
    zoom?: number;
    onSelectNote?: (noteId: string, multi?: boolean) => void;
    onUpdateNote?: (noteId: string, updates: Partial<Note>) => void;
    onDeleteNote?: (noteId: string) => void;
    onAddNote?: (note: Note) => void;
    onSeek?: (time: number) => void;
}

/**
 * Piano-roll timeline component showing all notes in a song,
 * organized by frequency (tone).
 */
export default function Timeline({
    song,
    allTones,
    selectedNoteIds,
    playingFrequencies,
    currentTime = 0,
    zoom = 100,
    onSelectNote,
    onUpdateNote,
    onDeleteNote,
    onAddNote,
    onSeek,
}: TimelineProps) {
    const [hoveredLaneFrequency, setHoveredLaneFrequency] = useState<number | null>(null);

    const beatDuration = 60 / song.bpm;
    const duration = calculateSongDuration(song);
    const totalPixels = (duration / beatDuration) * zoom;

    // Group notes by frequency for efficient rendering
    const notesByFrequency = useMemo(() => {
        const map = new Map<number, Note[]>();
        song.notes.forEach(note => {
            if (!map.has(note.frequency)) {
                map.set(note.frequency, []);
            }
            map.get(note.frequency)!.push(note);
        });
        return map;
    }, [song.notes]);

    // Handle click on empty space to add a note
    const handleLaneClick = (frequency: number, event: React.MouseEvent) => {
        if (!onAddNote) return;

        const lane = event.currentTarget as HTMLElement;
        const rect = lane.getBoundingClientRect();
        const clickX = event.clientX - rect.left;

        // Convert pixel position to time
        const clickTime = (clickX / zoom) * beatDuration;

        // Add note at clicked position with default duration of 0.5 seconds
        const newNote = createNote(frequency, clickTime, 0.5);
        onAddNote(newNote);
    };

    return (
        <div className={style.TimelineContainer}>
            {/* Ruler at top */}
            <div className={style.RulerContainer}>
                <div className={style.ToneNameColumn} />
                <div className={style.RulerScroll} style={{width: `${totalPixels}px`}}>
                    <TimelineRuler
                        bpm={song.bpm}
                        zoom={zoom}
                        duration={duration}
                        currentTime={currentTime}
                        onSeek={onSeek}
                    />
                </div>
            </div>

            {/* Lanes for each tone */}
            <div className={style.LanesContainer}>
                <div className={style.ToneNamesColumn}>
                    {allTones.map((tone, idx) => (
                        <div
                            key={tone.frequency}
                            className={`${style.ToneName} ${
                                tone.frequency === hoveredLaneFrequency ? style.Hovered : ""
                            }`}
                            style={{
                                height: `${50}px`,
                                backgroundColor:
                                    idx % 2 === 0
                                        ? "var(--color-surface)"
                                        : "var(--color-bg)",
                            }}
                            onMouseEnter={() => setHoveredLaneFrequency(tone.frequency)}
                            onMouseLeave={() => setHoveredLaneFrequency(null)}
                        >
                            <span>{tone.name}</span>
                            <span className={style.Frequency}>{tone.frequency.toFixed(1)}</span>
                        </div>
                    ))}
                </div>

                <div className={style.NotesScroll}>
                    {allTones.map((tone, idx) => {
                        const lanesNotes = notesByFrequency.get(tone.frequency) || [];

                        return (
                            <div
                                key={tone.frequency}
                                className={`${style.Lane} ${
                                    tone.frequency === hoveredLaneFrequency ? style.Hovered : ""
                                }`}
                                style={{
                                    height: `${50}px`,
                                    backgroundColor:
                                        idx % 2 === 0
                                            ? "var(--color-surface)"
                                            : "var(--color-bg)",
                                }}
                                onClick={e => handleLaneClick(tone.frequency, e)}
                                onMouseEnter={() => setHoveredLaneFrequency(tone.frequency)}
                                onMouseLeave={() => setHoveredLaneFrequency(null)}
                            >
                                {/* Notes in this lane */}
                                {lanesNotes.map(note => (
                                    <TimelineNote
                                        key={note.id}
                                        note={note}
                                        bpm={song.bpm}
                                        zoom={zoom}
                                        selected={selectedNoteIds.has(note.id)}
                                        isPlaying={playingFrequencies?.has(note.frequency)}
                                        onSelect={onSelectNote}
                                        onUpdate={onUpdateNote}
                                        onDelete={onDeleteNote}
                                    />
                                ))}

                                {/* Playhead in each lane */}
                                {currentTime !== undefined && (
                                    <div
                                        className={style.LanePlayhead}
                                        style={{
                                            left: `${(currentTime / beatDuration) * zoom}px`,
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Info bar */}
            <div className={style.InfoBar}>
                <span>Click on a lane to add notes | Drag notes to move | Drag edges to resize | Right-click to delete</span>
            </div>
        </div>
    );
}
