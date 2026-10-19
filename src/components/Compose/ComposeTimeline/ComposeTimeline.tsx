import {useMemo, type CSSProperties, type RefObject, type UIEventHandler} from "react";
import style from "./ComposeTimeline.module.scss";
import type {ComposeNote} from "../../../core/model/ComposeNote.ts";
import type {HarmoniumTone} from "../../../core/model/HarmoniumTone.ts";
import {assignLanes} from "../../../core/helper/ComposeTimelineHelper.ts";
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
};

const COLUMNS = Array.from({length: MANUAL_ROW_COUNT}, (_, column) => column);

/**
 * Timeline with the same columns as the manual below it. Time runs upwards from the bottom
 * edge: boxes fall down and sound the key underneath as they cross the fixed playhead line.
 */
export default function ComposeTimeline({notes, keyTones, activeNoteIds, duration, pixelsPerSecond, scrollRef, onScroll}: ComposeTimelineProps) {
    const lanes = useMemo(() => assignLanes(notes, key => KEY_COLUMNS[key]), [notes]);

    return (
        <div className={style.Timeline}>
            <div className={style.Scroll} ref={scrollRef} onScroll={onScroll}>
                <div
                    className={style.Content}
                    style={{"--duration-px": `${duration * pixelsPerSecond}px`} as CSSProperties}
                >
                    <div className={style.Columns}>
                        {COLUMNS.map(column => (
                            <div
                                key={column}
                                className={`${style.Column} ${isBlackKeyColumn(column) ? style.ColumnBlack : ""}`}
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
                                className={`${style.Note} ${activeNoteIds.has(note.id) ? style.NoteActive : ""} ${tone ? "" : style.NoteUnassigned}`}
                                style={{
                                    backgroundColor: `var(--manual-key-${KEY_COLOURS[note.key]})`,
                                    bottom: note.start * pixelsPerSecond,
                                    height: note.duration * pixelsPerSecond,
                                    left: `calc((${column} + ${lane} / ${laneCount}) * var(--column) + 1px)`,
                                    width: `calc(var(--column) / ${laneCount} - 2px)`,
                                }}
                            >
                                {tone?.name}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className={style.Playhead}/>
        </div>
    );
}
