import style from "./SoundSelector.module.scss";
import {ENGINE_OPTIONS} from "../../../core/audio/soundEngines.ts";
import type {EngineId} from "../../../core/audio/ToneEngine.ts";
import {useSoundEngine} from "../../../hooks/useSoundEngine.ts";

export default function SoundSelector() {
    const {engineId, status, selectEngine} = useSoundEngine();

    return (
        <div className={style.SoundSelector}>
            <label htmlFor="sound-engine">Sound</label>
            <select
                id="sound-engine"
                value={engineId}
                onChange={(e) => selectEngine(e.target.value as EngineId)}
            >
                {ENGINE_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                ))}
            </select>
            {status.state === "loading" && <span className={style.Status}>loading…</span>}
            {status.state === "error" && (
                <span className={style.Error} title={status.message}>
                    unavailable: {status.message}
                    {" "}
                    <button type="button" onClick={() => selectEngine(engineId)}>retry</button>
                </span>
            )}
        </div>
    );
}
