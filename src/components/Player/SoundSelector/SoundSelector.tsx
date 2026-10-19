import style from "./SoundSelector.module.scss";
import {ENGINE_OPTIONS} from "../../../core/audio/soundEngines.ts";
import type {EngineId} from "../../../core/audio/ToneEngine.ts";
import {useSoundEngine} from "../../../hooks/useSoundEngine.ts";
import {useI18n} from "../../../i18n.tsx";

export default function SoundSelector() {
    const {engineId, status, selectEngine} = useSoundEngine();
    const {t} = useI18n();

    return (
        <div className={style.SoundSelector}>
            <label htmlFor="sound-engine">{t("sound.label")}</label>
            <select
                id="sound-engine"
                value={engineId}
                onChange={(e) => selectEngine(e.target.value as EngineId)}
            >
                {ENGINE_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>
                        {option.id === "synth" ? t("sound.synth") : t("sound.sample")}
                    </option>
                ))}
            </select>
            {status.state === "loading" && <span className={style.Status}>{t("sound.loading")}</span>}
            {status.state === "error" && (
                <span className={style.Error} title={status.message}>
                    {t("sound.unavailable", {message: status.message})}
                    {" "}
                    <button type="button" onClick={() => selectEngine(engineId)}>{t("sound.retry")}</button>
                </span>
            )}
        </div>
    );
}
