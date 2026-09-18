import {useRef, useState, useEffect} from "react";
import style from "./TimelineNote.module.scss";
import type {Note} from "../../../core/model/Song.ts";

interface TimelineNoteProps {
    note: Note;
    bpm: number;
    zoom: number; // pixels per beat
    selected?: boolean;
    isPlaying?: boolean;
    onSelect?: (noteId: string, multi?: boolean) => void;
    onUpdate?: (noteId: string, updates: Partial<Note>) => void;
    onDelete?: (noteId: string) => void;
}

/**
 * Individual note element in the timeline.
 * Supports drag to move, resize edges to change duration, and delete.
 */
export default function TimelineNote({
    note,
    bpm,
    zoom,
    selected,
    isPlaying,
    onSelect,
    onUpdate,
    onDelete,
}: TimelineNoteProps) {
    const noteRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState<"move" | "resize-start" | "resize-end" | null>(null);
    const [dragStart, setDragStart] = useState({x: 0, y: 0});

    const beatDuration = 60 / bpm; // seconds per beat
    const startPixel = (note.time / beatDuration) * zoom;
    const durationPixels = (note.duration / beatDuration) * zoom;

    // Handle mouse down on note body (move)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left mouse button
        e.stopPropagation();

        setDragStart({x: e.clientX, y: e.clientY});
        setDragMode("move");
        setIsDragging(true);

        if (onSelect) {
            onSelect(note.id, e.ctrlKey || e.metaKey);
        }
    };

    // Handle mouse down on resize edges
    const handleResizeStart = (e: React.MouseEvent, mode: "resize-start" | "resize-end") => {
        if (e.button !== 0) return;
        e.stopPropagation();

        setDragStart({x: e.clientX, y: e.clientY});
        setDragMode(mode);
        setIsDragging(true);
    };

    // Handle mouse move globally
    useEffect(() => {
        if (!isDragging || !dragMode || !onUpdate) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - dragStart.x;
            const secondsPerPixel = (beatDuration / zoom);

            if (dragMode === "move") {
                const deltaSeconds = deltaX * secondsPerPixel;
                const newTime = Math.max(0, note.time + deltaSeconds);
                onUpdate(note.id, {time: newTime});
            } else if (dragMode === "resize-start") {
                const deltaSeconds = deltaX * secondsPerPixel;
                const newTime = note.time + deltaSeconds;
                const newDuration = note.duration - deltaSeconds;
                if (newDuration > 0.1) { // Minimum duration
                    onUpdate(note.id, {time: newTime, duration: newDuration});
                }
            } else if (dragMode === "resize-end") {
                const deltaSeconds = deltaX * secondsPerPixel;
                const newDuration = Math.max(0.1, note.duration + deltaSeconds);
                onUpdate(note.id, {duration: newDuration});
            }

            setDragStart({x: e.clientX, y: e.clientY});
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setDragMode(null);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, dragMode, dragStart, note, bpm, zoom, onUpdate, beatDuration]);

    // Handle delete
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(note.id);
        }
    };

    // Handle context menu
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Simple implementation: delete on right-click
        if (onDelete) {
            onDelete(note.id);
        }
    };

    return (
        <div
            ref={noteRef}
            className={`${style.TimelineNote} ${selected ? style.Selected : ""} ${
                isPlaying ? style.Playing : ""
            }`}
            style={{
                left: `${startPixel}px`,
                width: `${durationPixels}px`,
                minWidth: "20px",
            }}
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
            title={`${note.frequency.toFixed(1)} Hz`}
        >
            {/* Resize handles */}
            <div
                className={style.ResizeHandle}
                style={{left: 0}}
                onMouseDown={e => handleResizeStart(e, "resize-start")}
                title="Drag to change start time"
            />
            <div
                className={style.ResizeHandle}
                style={{right: 0}}
                onMouseDown={e => handleResizeStart(e, "resize-end")}
                title="Drag to change duration"
            />

            {/* Delete button (visible on hover) */}
            <button
                className={style.DeleteButton}
                onClick={handleDelete}
                title="Delete note"
                aria-label="Delete note"
            >
                ×
            </button>

            {/* Note info */}
            <div className={style.NoteLabel}>{note.frequency.toFixed(0)} Hz</div>
        </div>
    );
}
