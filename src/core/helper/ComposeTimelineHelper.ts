import type {ComposeNote} from "../model/ComposeNote.ts";

/** Notes snap to multiples of this many seconds while editing. */
export const SNAP_STEP = 0.125;

/** Length of a newly added note in seconds. */
export const DEFAULT_NOTE_DURATION = 0.5;

export function snapTime(time: number, step = SNAP_STEP): number {
    return Math.round(time / step) * step;
}

// move: shifts the note; resize-end: the upper edge (end); resize-start: the lower edge (start)
export type NoteDragMode = "move" | "resize-start" | "resize-end";

/**
 * New start and duration of `note` after dragging it by `deltaSeconds` (positive = later).
 * Results snap to the grid, never start before 0 and never get shorter than one step.
 */
export function dragNote(
    note: ComposeNote,
    mode: NoteDragMode,
    deltaSeconds: number,
    step = SNAP_STEP
): {start: number; duration: number} {
    const end = note.start + note.duration;

    if (mode === "move") {
        return {start: Math.max(0, snapTime(note.start + deltaSeconds, step)), duration: note.duration};
    }

    if (mode === "resize-end") {
        return {start: note.start, duration: Math.max(step, snapTime(end + deltaSeconds, step) - note.start)};
    }

    const start = Math.min(Math.max(0, snapTime(note.start + deltaSeconds, step)), end - step);
    return {start, duration: end - start};
}

export interface NoteLane {
    lane: number;
    // Number of lanes shared by the cluster of overlapping notes this note belongs to.
    lanes: number;
}

/** Time at which the last note ends. */
export function getCompositionDuration(notes: ComposeNote[]): number {
    return notes.reduce((end, note) => Math.max(end, note.start + note.duration), 0);
}

// Playback ends every note a little early, so that a note directly followed by one on the same
// key is heard as two notes instead of one long one.
export const ARTICULATION_GAP = 0.04;

/** Notes sounding at `time`: from their start up to their end, minus the articulation gap. */
export function getActiveNotes(notes: ComposeNote[], time: number): ComposeNote[] {
    return notes.filter(note => {
        const gap = Math.min(ARTICULATION_GAP, note.duration / 2);
        return note.start <= time && time < note.start + note.duration - gap;
    });
}

/** Keys held at `time`. */
export function getActiveKeys(notes: ComposeNote[], time: number): Set<number> {
    return new Set(getActiveNotes(notes, time).map(note => note.key));
}

/**
 * Splits the width of a column between notes of the same column that overlap in time, so that
 * simultaneous notes on different keys of one column stay visible side by side.
 */
export function assignLanes(notes: ComposeNote[], columnOfKey: (key: number) => number): Map<string, NoteLane> {
    const byColumn = new Map<number, ComposeNote[]>();
    for (const note of notes) {
        const column = columnOfKey(note.key);
        byColumn.set(column, [...(byColumn.get(column) ?? []), note]);
    }

    const result = new Map<string, NoteLane>();

    for (const columnNotes of byColumn.values()) {
        const sorted = [...columnNotes].sort((a, b) => a.start - b.start || a.key - b.key);

        let cluster: {note: ComposeNote; lane: number}[] = [];
        let laneEnds: number[] = [];
        let clusterEnd = -Infinity;

        const closeCluster = () => {
            for (const {note, lane} of cluster) {
                result.set(note.id, {lane, lanes: laneEnds.length});
            }
            cluster = [];
            laneEnds = [];
        };

        for (const note of sorted) {
            if (note.start >= clusterEnd) closeCluster();

            let lane = laneEnds.findIndex(end => end <= note.start);
            if (lane === -1) lane = laneEnds.length;

            laneEnds[lane] = note.start + note.duration;
            clusterEnd = Math.max(clusterEnd, note.start + note.duration);
            cluster.push({note, lane});
        }
        closeCluster();
    }

    return result;
}
