import {useCallback, useEffect, useRef, useState, type ChangeEvent} from "react";
import style from "./ProjectFileControls.module.scss";
import {loadRegisters} from "../../../core/data/RegisterConfiguration.ts";
import {downloadFile} from "../../../core/helper/DownloadHelper.ts";
import {parseProject, serializeProject} from "../../../core/project/ProjectFile.ts";
import {applyProjectState, captureProjectState} from "../../../hooks/projectState.ts";
import {useI18n} from "../../../i18n.tsx";

/** Buttons to save the whole app state to a file and to load such a file again. */
export default function ProjectFileControls() {
    const {t} = useI18n();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Messages go away on their own
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => setMessage(null), 8000);
        return () => clearTimeout(timer);
    }, [message]);

    const save = useCallback(async () => {
        const registers = await loadRegisters();
        if (registers.length === 0) {
            setMessage(t("project.registersMissing"));
            return;
        }

        downloadFile(serializeProject(captureProjectState(registers)), "harmonium-project.json", "application/json");
        setMessage(t("project.saved"));
    }, [t]);

    const load = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Allow choosing the same file again
        e.target.value = "";
        if (!file) return;

        try {
            const registers = await loadRegisters();
            if (registers.length === 0) {
                setMessage(t("project.registersMissing"));
                return;
            }

            const state = parseProject(await file.text(), registers);
            if (!window.confirm(t("project.loadConfirm"))) return;

            applyProjectState(state);
            setMessage(t("project.loaded"));
        } catch (error) {
            setMessage(t("project.loadFailed", {message: error instanceof Error ? error.message : String(error)}));
        }
    }, [t]);

    return (
        <div className={style.ProjectFileControls}>
            {message && <span className={style.Message} role="status">{message}</span>}
            <button type="button" className={style.Button} onClick={save}>{t("project.save")}</button>
            <button type="button" className={style.Button} onClick={() => fileInputRef.current?.click()}>
                {t("project.load")}
            </button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" hidden onChange={load}/>
        </div>
    );
}
