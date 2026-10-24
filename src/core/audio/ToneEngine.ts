export const ENGINE_IDS = ["synth", "sample"] as const;
export type EngineId = typeof ENGINE_IDS[number];

export type EngineStatus =
    | {state: "loading"}
    | {state: "ready"}
    | {state: "error"; message: string};

/** A way of turning a frequency into sound. */
export interface ToneEngine {
    /** Loads whatever the engine needs; rejects with a readable error if that fails. */
    prepare(): Promise<void>;
    playTone(frequency: number): void;
    stopTone(frequency: number): void;
    stopAll(): void;
}
