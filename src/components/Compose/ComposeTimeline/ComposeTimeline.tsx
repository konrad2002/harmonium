import {useMemo, useRef, type CSSProperties, type MouseEvent, type PointerEvent, type RefObject, type UIEventHandler} from "react";
import style from "./ComposeTimeline.module.scss";
import type {ComposeNote} from "../../../core/model/ComposeNote.ts";
import type {HarmoniumTone} from "../../../core/model/HarmoniumTone.ts";
import {assignLanes, dragNote, snapTime, type NoteDragMode} from "../../../core/helper/ComposeTimelineHelper.ts";
import {KEY_COLOURS, KEY_COLUMNS, isBlackKeyColumn} from "../../../core/data/ManualLayout.ts";
import {MANUAL_ROW_COUNT} from "../../../core/data/RegisterConfiguration.ts";

type ComposeTimelineProps = {
    notes: ComposeNote[];
    // Tone of every manual key (null = unassigned), used for the box labels
    keyTones: (HarmoniumTone | null)[];
    activeNoteIds: ReadonlySet<string>;
    // Length in seconds
    duration: number;
    pixelsPerSecond: number;
    scrollRef: RefObject<HTMLDivElement | null>;
    onScroll: UIEventHandler<HTMLDivElement>;
    // Edit mode: clicking the column of the selected key adds a note; notes can be dragged
    editable?: boolean;
    selectedKey?: number | null;
    selectedNoteId?: string | null;
    onAddNote?: (key: number, start: number) => void;
    onChangeNote?: (id: string, change: {start: number; duration: number}) => void;
    onSelectNote?: (id: string | null) => void;
};

const COLUMNS = Array.from({length: MANUAL_ROW_COUNT}, (_, column) => column);

type Drag = {id: string; mode: NoteDragMode; startY: number; note: ComposeNote};

/**
 * Timeline with the same columns as the manual below it. Time runs upwards from the bottom
 * edge: boxes fall down and sound the key underneath as they cross the fixed playhead line.
 */
export default function ComposeTimeline({
    notes, keyTones, activeNoteIds, duration, pixelsPerSecond, scrollRef, onScroll,
    editable = false, selectedKey = null, selectedNoteId = null, onAddNote, onChangeNote, onSelectNote,
}: ComposeTimelineProps) {
    const lanes = useMemo(() => assignLanes(notes, key => KEY_COLUMNS[key]), [notes]);
    const dragRef = useRef<Drag | null>(null);
    const targetColumn = editable && selectedKey !== null ? KEY_COLUMNS[selectedKey] : null;

    function handleColumnsClick(e: MouseEvent<HTMLDivElement>) {
        if (!editable) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const column = Math.floor((e.clientX - rect.left) / (rect.width / MANUAL_ROW_COUNT));

        if (selectedKey === null || column !== targetColumn) {
            onSelectNote?.(null);
            return;
        }
        onAddNote?.(selectedKey, Math.max(0, snapTime((rect.bottom - e.clientY) / pixelsPerSecond)));
    }

    function handlePointerDown(e: PointerEvent<HTMLDivElement>, note: ComposeNote) {
        if (!editable) return;

        const handle = (e.target as HTMLElement).dataset.handle;
        const mode: NoteDragMode = handle === "end" ? "resize-end" : handle === "start" ? "resize-start" : "move";

        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = {id: note.id, mode, startY: e.clientY, note};
        onSelectNote?.(note.id);
    }

    function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
        const drag = dragRef.current;
        if (!drag) return;
        // Dragging up moves to later times
        const deltaSeconds = -(e.clientY - drag.startY) / pixelsPerSecond;
        onChangeNote?.(drag.id, dragNote(drag.note, drag.mode, deltaSeconds));
    }

    function endDrag() {
        dragRef.current = null;
    }

    return (
        <div className={style.Timeline}>
            <div className={style.Scroll} ref={scrollRef} onScroll={onScroll}>
                <div
                    className={style.Content}
                    style={{"--duration-px": `${duration * pixelsPerSecond}px`} as CSSProperties}
                >
                    <div className={style.Columns} onClick={handleColumnsClick}>
                        {COLUMNS.map(column => (
                            <div
                                key={column}
                                className={`${style.Column} ${isBlackKeyColumn(column) ? style.ColumnBlack : ""} ${column === targetColumn ? style.ColumnTarget : ""}`}
                            />
                        ))}
                    </div>

                    {notes.map(note => {
                        const column = KEY_COLUMNS[note.key];
                        const {lane, lanes: laneCount} = lanes.get(note.id) ?? {lane: 0, lanes: 1};
                        const tone = keyTones[note.key];

                        return (
                            <div
                                key={note.id}
                                className={[
                                    style.Note,
                                    activeNoteIds.has(note.id) ? style.NoteActive : "",
                                    tone ? "" : style.NoteUnassigned,
                                    editable ? style.NoteEditable : "",
                                    editable && note.id === selectedNoteId ? style.NoteSelected : "",
                                ].join(" ")}
                                style={{
                                    backgroundColor: `var(--manual-key-${KEY_COLOURS[note.key]})`,
                                    bottom: note.start * pixelsPerSecond,
                                    height: note.duration * pixelsPerSecond,
                                    left: `calc((${column} + ${lane} / ${laneCount}) * var(--column) + 1px)`,
                                    width: `calc(var(--column) / ${laneCount} - 2px)`,
                                }}
                                onPointerDown={e => handlePointerDown(e, note)}
                                onPointerMove={handlePointerMove}
                                onPointerUp={endDrag}
                                onPointerCancel={endDrag}
                            >
                                {tone?.name}
                                {editable && <div className={style.HandleEnd} data-handle="end"/>}
                                {editable && <div className={style.HandleStart} data-handle="start"/>}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className={style.Playhead}/>
        </div>
    );
}
