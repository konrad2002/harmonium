import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import style from "./ComposeView.module.scss";
import Manual from "../../ManualView/Manual/Manual.tsx";
import RegisterSelector from "../../ManualView/RegisterSelector/RegisterSelector.tsx";
import ComposeTimeline from "../../Compose/ComposeTimeline/ComposeTimeline.tsx";
import VolumeControl from "../../Player/VolumeControl/VolumeControl.tsx";
import SoundSelector from "../../Player/SoundSelector/SoundSelector.tsx";
import useHarmoniumSynth from "../../../hooks/useHarmoniumSynth.ts";
import {useInstrumentTones} from "../../../hooks/useInstrumentTones.ts";
import useTimelinePlayer from "../../../hooks/useTimelinePlayer.ts";
import {EXAMPLE_COMPOSITION} from "../../../core/data/ExampleComposition.ts";
import {DEFAULT_NOTE_DURATION, getCompositionDuration} from "../../../core/helper/ComposeTimelineHelper.ts";
import type {ComposeNote} from "../../../core/model/ComposeNote.ts";
import {useI18n} from "../../../i18n.tsx";

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
    const {t} = useI18n();
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

    // Fullscreen: a fixed overlay (works everywhere), plus the browser's fullscreen where available
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [fullscreen, setFullscreen] = useState(false);

    const exitFullscreen = useCallback(() => {
        setFullscreen(false);
        if (document.fullscreenElement) void document.exitFullscreen();
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (fullscreen) {
            exitFullscreen();
            return;
        }
        setFullscreen(true);
        wrapperRef.current?.requestFullscreen?.()?.catch(() => {
            // The overlay alone is enough when the browser refuses
        });
    }, [fullscreen, exitFullscreen]);

    useEffect(() => {
        // Leaving the browser's fullscreen (e.g. with Escape) also leaves ours
        const handleChange = () => {
            if (!document.fullscreenElement) setFullscreen(false);
        };
        document.addEventListener("fullscreenchange", handleChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleChange);
            if (document.fullscreenElement) void document.exitFullscreen();
        };
    }, []);

    useEffect(() => {
        if (!fullscreen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") exitFullscreen();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [fullscreen, exitFullscreen]);

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
        <div ref={wrapperRef} className={fullscreen ? style.Fullscreen : undefined}>
            {!fullscreen && (
                <RegisterSelector
                    registers={instrument.registers}
                    activeRegisterIds={instrument.activeRegisterIds}
                    onToggleRegister={instrument.toggleRegister}
                />
            )}
            <div className={style.Controls}>
                <div className={style.ButtonGroup}>
                    <button
                        type="button"
                        className={`${style.Button} ${editMode ? style.ButtonActive : ""}`}
                        onClick={toggleEditMode}
                        aria-pressed={editMode}
                    >
                        {editMode ? t("compose.editDone") : t("compose.edit")}
                    </button>
                </div>
                <div className={style.ButtonGroup}>
                    <button type="button" className={style.Button} onClick={player.stop} disabled={editMode} aria-label={t("playback.stopAria")}>
                        {t("playback.stop")}
                    </button>
                    <button
                        type="button"
                        className={style.Button}
                        onClick={isPlaying ? player.pause : player.play}
                        disabled={editMode}
                        aria-label={isPlaying ? t("playback.pauseAria") : t("playback.playAria")}
                    >
                        {isPlaying ? t("playback.pause") : t("playback.play")}
                    </button>
                </div>
                <div className={style.Time}>{formatTime(player.currentTime)} / {formatTime(duration)}</div>
                <VolumeControl/>
                <SoundSelector/>
                <div className={style.ButtonGroup}>
                    <button type="button" className={style.Button} onClick={toggleFullscreen} aria-pressed={fullscreen}>
                        {fullscreen ? t("compose.exitFullscreen") : t("compose.fullscreen")}
                    </button>
                </div>
                {editMode && (
                    <div className={style.Hint}>{t("compose.hint")}</div>
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
                showRegisters={false}
                showFrequencies={false}
                fill={fullscreen}
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
                        fill={fullscreen}
                    />
                }
            />
        </div>
    );
}
