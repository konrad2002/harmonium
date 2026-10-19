import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import style from "./ComposeView.module.scss";
import Manual from "../../ManualView/Manual/Manual.tsx";
import ComposeTimeline from "../../Compose/ComposeTimeline/ComposeTimeline.tsx";
import VolumeControl from "../../Player/VolumeControl/VolumeControl.tsx";
import SoundSelector from "../../Player/SoundSelector/SoundSelector.tsx";
import useHarmoniumSynth from "../../../hooks/useHarmoniumSynth.ts";
import {useInstrumentTones} from "../../../hooks/useInstrumentTones.ts";
import useTimelinePlayer from "../../../hooks/useTimelinePlayer.ts";
import {EXAMPLE_COMPOSITION} from "../../../core/data/ExampleComposition.ts";
import {DEFAULT_NOTE_DURATION, getCompositionDuration} from "../../../core/helper/ComposeTimelineHelper.ts";
import type {ComposeNote} from "../../../core/model/ComposeNote.ts";

const PIXELS_PER_SECOND = 120;

function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds - minutes * 60).toFixed(1).padStart(4, "0")}`;
}

/**
 * Compose view: a timeline whose columns line up with the manual below it. Boxes fall down
 * onto a fixed line and sound the key underneath. In edit mode, notes can be added, moved,
 * resized and deleted.
 */
export default function ComposeView() {
    const instrument = useInstrumentTones();
    const {playTone, stopTone} = useHarmoniumSynth();

    const [notes, setNotes] = useState<ComposeNote[]>(EXAMPLE_COMPOSITION);
    const [editMode, setEditMode] = useState(false);
    const [selectedKey, setSelectedKey] = useState<number | null>(null);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

    const duration = useMemo(() => getCompositionDuration(notes), [notes]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const player = useTimelinePlayer({notes, duration, pixelsPerSecond: PIXELS_PER_SECOND, scrollRef});
    const {stop: stopPlayback} = player;

    const toggleEditMode = useCallback(() => {
        if (!editMode) stopPlayback();
        setEditMode(!editMode);
        setSelectedKey(null);
        setSelectedNoteId(null);
    }, [editMode, stopPlayback]);

    const addNote = useCallback((key: number, start: number) => {
        const id = crypto.randomUUID();
        setNotes(prev => [...prev, {id, key, start, duration: DEFAULT_NOTE_DURATION}]);
        setSelectedNoteId(id);
    }, []);

    const changeNote = useCallback((id: string, change: {start: number; duration: number}) => {
        setNotes(prev => prev.map(note => note.id === id ? {...note, ...change} : note));
    }, []);

    // Delete removes the selected note
    useEffect(() => {
        if (!editMode || !selectedNoteId) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Delete" && e.key !== "Backspace") return;
            if ((e.target as HTMLElement).closest("input, select, textarea")) return;
            e.preventDefault();
            setNotes(prev => prev.filter(note => note.id !== selectedNoteId));
            setSelectedNoteId(null);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [editMode, selectedNoteId]);

    // Frequency sounding for each key under the playhead
    const soundingRef = useRef(new Map<number, number>());

    useEffect(() => {
        const sounding = soundingRef.current;

        for (const [key, frequency] of sounding) {
            if (!player.activeKeys.has(key)) {
                stopTone(frequency);
                sounding.delete(key);
            }
        }

        for (const key of player.activeKeys) {
            const tone = instrument.keyTones[key];
            if (sounding.has(key) || !tone) continue;
            playTone(tone.frequency);
            sounding.set(key, tone.frequency);
        }
    }, [player.activeKeys, instrument.keyTones, playTone, stopTone]);

    // Release everything when leaving the view
    useEffect(() => {
        const sounding = soundingRef.current;
        return () => {
            for (const frequency of sounding.values()) stopTone(frequency);
            sounding.clear();
        };
    }, [stopTone]);

    const isPlaying = player.state === "playing";

    return (
        <>
            <div className={style.Controls}>
                <div className={style.ButtonGroup}>
                    <button
                        type="button"
                        className={`${style.Button} ${editMode ? style.ButtonActive : ""}`}
                        onClick={toggleEditMode}
                        aria-pressed={editMode}
                    >
                        {editMode ? "✓ Done editing" : "✎ Edit"}
                    </button>
                </div>
                <div className={style.ButtonGroup}>
                    <button type="button" className={style.Button} onClick={player.stop} disabled={editMode} aria-label="Stop playback">
                        ⏹ Stop
                    </button>
                    <button
                        type="button"
                        className={style.Button}
                        onClick={isPlaying ? player.pause : player.play}
                        disabled={editMode}
                        aria-label={isPlaying ? "Pause playback" : "Play"}
                    >
                        {isPlaying ? "⏸ Pause" : "▶ Play"}
                    </button>
                </div>
                <div className={style.Time}>{formatTime(player.currentTime)} / {formatTime(duration)}</div>
                <VolumeControl/>
                <SoundSelector/>
                {editMode && (
                    <div className={style.Hint}>
                        Select a key, then click its highlighted column to add a note. Drag a note to move it, drag its
                        top or bottom edge to resize it, press Delete to remove it.
                    </div>
                )}
            </div>
            <Manual
                layout="compose"
                instrument={instrument}
                activeKeys={player.activeKeys}
                selectionMode={editMode}
                selectedKey={selectedKey}
                onSelectKey={setSelectedKey}
                showVolume={false}
                topSlot={
                    <ComposeTimeline
                        notes={notes}
                        keyTones={instrument.keyTones}
                        activeNoteIds={player.activeNoteIds}
                        duration={duration}
                        pixelsPerSecond={PIXELS_PER_SECOND}
                        scrollRef={scrollRef}
                        onScroll={player.handleScroll}
                        editable={editMode}
                        selectedKey={selectedKey}
                        selectedNoteId={selectedNoteId}
                        onAddNote={addNote}
                        onChangeNote={changeNote}
                        onSelectNote={setSelectedNoteId}
                    />
                }
            />
        </>
    );
}
