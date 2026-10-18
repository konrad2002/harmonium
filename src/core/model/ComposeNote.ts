/** A note on the compose timeline: one manual key held for a while. Times are in seconds. */
export interface ComposeNote {
    id: string;
    // Global key index (see ManualLayout); the sounding tone depends on the active registers.
    key: number;
    start: number;
    duration: number;
}
