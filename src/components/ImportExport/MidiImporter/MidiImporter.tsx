import {useState} from "react";
import style from "./MidiImporter.module.scss";
import {loadSongFromMidi} from "../../../core/helper/MidiHelper.ts";
import type {Song} from "../../../core/model/Song.ts";
import type {HarmoniumTone} from "../../../core/model/HarmoniumTone.ts";
import {useI18n} from "../../../i18n.tsx";

interface MidiImporterProps {
    availableTones: HarmoniumTone[];
    onSongImported?: (song: Song) => void;
}

export default function MidiImporter({availableTones, onSongImported}: MidiImporterProps) {
    const {t} = useI18n();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Convert HarmoniumTone[] to {frequency, name}[]
            const toneMap = availableTones.map(tone => ({
                frequency: tone.frequency,
                name: tone.name,
            }));

            const song = await loadSongFromMidi(file, toneMap);
            setSuccessMessage(t("midiImport.success", {title: song.title, count: song.notes.length}));
            onSongImported?.(song);

            // Clear the file input
            e.target.value = "";
        } catch (err) {
            const message = err instanceof Error ? err.message : t("midiImport.unknownError");
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={style.MidiImporter}>
            <div className={style.Section}>
                <h3>{t("midiImport.title")}</h3>
                <p>{t("midiImport.description")}</p>

                <label className={style.FileInput}>
                    <input
                        type="file"
                        accept=".mid,.midi"
                        onChange={handleFileSelect}
                        disabled={isLoading}
                    />
                    <span className={style.Label}>
                        {isLoading ? t("midiImport.loading") : t("midiImport.chooseFile")}
                    </span>
                </label>

                {error && <div className={style.Error}>{error}</div>}
                {successMessage && <div className={style.Success}>{successMessage}</div>}
            </div>

            <div className={style.Info}>
                <h4>{t("midiImport.howItWorks")}</h4>
                <ul>
                    <li>{t("midiImport.mapping")}</li>
                    <li>{t("midiImport.tuning")}</li>
                    <li>{t("midiImport.matching")}</li>
                    <li>{t("midiImport.timing")}</li>
                </ul>
            </div>
        </div>
    );
}
