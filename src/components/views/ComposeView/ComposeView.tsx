import {useState, useEffect} from "react";
import style from "./ComposeView.module.scss";
import Timeline from "../../Timeline/Timeline/Timeline.tsx";
import TransportControls, {type PlaybackState} from "../../Timeline/TransportControls/TransportControls.tsx";
import Manual from "../../ManualView/Manual/Manual.tsx";
import useSongPlayer from "../../../hooks/useSongPlayer.ts";
import useHarmoniumSynth from "../../../hooks/useHarmoniumSynth.ts";
import {useTimelineEditor} from "../../../hooks/useTimelineEditor.ts";
import {EXAMPLE_SONGS} from "../../../core/data/ExampleSongs.ts";
import {calculateSongDuration} from "../../../core/helper/TimelineHelper.ts";
import type {Song} from "../../../core/model/Song.ts";
import type {HarmoniumTone} from "../../../core/model/HarmoniumTone.ts";

interface ComposeViewProps {
    availableTones?: HarmoniumTone[];
}

/**
 * Compose view: Timeline-based song editor with live preview
 */
export default function ComposeView({availableTones = []}: ComposeViewProps) {
    // Initialize with first example song or empty
    const [song] = useState<Song>(EXAMPLE_SONGS[0] || {
        title: "Untitled",
        bpm: 120,
        notes: [],
    });

    const [timelineState, timelineActions] = useTimelineEditor(song);
    const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
    const [playingFrequencies, setPlayingFrequencies] = useState<Set<number>>(new Set());

    // Sync external song changes into timeline state
    useEffect(() => {
        timelineActions.setSong(song);
    }, [song, timelineActions]);

    // Use song player for playback
    const songPlayer = useSongPlayer(
        playbackState === "playing" ? timelineState.song : null,
        {
            onPlayingFrequencies: setPlayingFrequencies,
        }
    );

    // Synth for live recording
    const synth = useHarmoniumSynth();

    // Update recording state when playback state changes
    useEffect(() => {
        if (playbackState === "playing") {
            timelineActions.setRecording(true);
            songPlayer.play?.();
        } else if (playbackState === "paused") {
            songPlayer.pause?.();
        } else if (playbackState === "stopped") {
            timelineActions.setRecording(false);
            songPlayer.stop?.();
            timelineActions.setCurrentTime(0);
        }
    }, [playbackState, songPlayer, timelineActions]);

    // Update current time display
    useEffect(() => {
        const interval = setInterval(() => {
            if (playbackState === "playing") {
                timelineActions.setCurrentTime(songPlayer.currentTime ?? 0);
            }
        }, 50);
        return () => clearInterval(interval);
    }, [playbackState, songPlayer, timelineActions]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                setPlaybackState(prev =>
                    prev === "playing" ? "paused" : "playing"
                );
            }
            if (e.code === "KeyL" && !e.ctrlKey) {
                e.preventDefault();
                timelineActions.setLoop(
                    !timelineState.loopEnabled
                );
            }
            if (e.code === "Delete" || e.code === "Backspace") {
                timelineActions.deleteSelectedNotes();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [timelineState.loopEnabled, timelineActions]);

    const handleRecordKeyPress = (frequency: number) => {
        if (timelineState.isRecording) {
            timelineActions.recordKeyPress(frequency, 0.5);
        }
    };

    const handleRecordKeyRelease = () => {
        // Optional: add logic for note-off
    };

    return (
        <div className={style.ComposeView}>
            {/* Header with song info */}
            <div className={style.Header}>
                <div className={style.SongInfo}>
                    <input
                        type="text"
                        value={timelineState.song.title}
                        onChange={e =>
                            timelineActions.updateSongTitle(e.target.value)
                        }
                        className={style.SongTitle}
                        placeholder="Song title"
                    />
                </div>
                <div className={style.Stats}>
                    <span>{timelineState.song.notes.length} notes</span>
                    <span>·</span>
                    <span>{calculateSongDuration(timelineState.song).toFixed(1)}s</span>
                </div>
            </div>

            {/* Transport controls */}
            <div className={style.TransportSection}>
                <TransportControls
                    bpm={timelineState.song.bpm}
                    currentTime={timelineState.currentTime}
                    duration={calculateSongDuration(timelineState.song)}
                    playbackState={playbackState}
                    loopEnabled={timelineState.loopEnabled}
                    zoom={timelineState.zoom}
                    onPlay={() => setPlaybackState("playing")}
                    onPause={() => setPlaybackState("paused")}
                    onStop={() => setPlaybackState("stopped")}
                    onSeek={time => {
                        timelineActions.setCurrentTime(time);
                        songPlayer.seek?.(time);
                    }}
                    onBPMChange={bpm =>
                        timelineActions.updateSongBPM(bpm)
                    }
                    onZoomChange={zoom =>
                        timelineActions.setZoom(zoom)
                    }
                    onToggleLoop={enabled =>
                        timelineActions.setLoop(enabled)
                    }
                />
            </div>

            {/* Main editing area */}
            <div className={style.EditingArea}>
                {/* Timeline */}
                <div className={style.TimelineSection}>
                    <Timeline
                        song={timelineState.song}
                        allTones={availableTones.map(t => ({
                            frequency: t.frequency,
                            name: t.name,
                        }))}
                        selectedNoteIds={timelineState.selectedNoteIds}
                        playingFrequencies={playingFrequencies}
                        currentTime={timelineState.currentTime}
                        zoom={timelineState.zoom}
                        onSelectNote={timelineActions.selectNote}
                        onUpdateNote={timelineActions.updateNote}
                        onDeleteNote={timelineActions.deleteNote}
                        onAddNote={timelineActions.addNote}
                        onSeek={time => {
                            timelineActions.setCurrentTime(time);
                            songPlayer.seek?.(time);
                        }}
                    />
                </div>

                {/* Live keyboard for recording */}
                <div className={style.KeyboardSection}>
                    <h3>Keyboard (click to record)</h3>
                    <Manual
                        layout="compact"
                        playingFrequencies={playingFrequencies}
                        onKeyDown={(frequency: number) => {
                            handleRecordKeyPress(frequency);
                            synth.playTone(frequency);
                        }}
                        onKeyUp={(frequency: number) => {
                            handleRecordKeyRelease();
                            synth.stopTone(frequency);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
