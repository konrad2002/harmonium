import type {ComposeNote} from "../model/ComposeNote.ts";

export interface NoteLane {
    lane: number;
    // Number of lanes shared by the cluster of overlapping notes this note belongs to.
    lanes: number;
}

/** Time at which the last note ends. */
export function getCompositionDuration(notes: ComposeNote[]): number {
    return notes.reduce((end, note) => Math.max(end, note.start + note.duration), 0);
}

/** Keys held at `time` (a note is held from its start up to, excluding, its end). */
export function getActiveKeys(notes: ComposeNote[], time: number): Set<number> {
    const keys = new Set<number>();
    for (const note of notes) {
        if (note.start <= time && time < note.start + note.duration) {
            keys.add(note.key);
        }
    }
    return keys;
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
