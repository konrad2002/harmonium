import style from "./MidiExporter.module.scss";
import {downloadSongAsMidi, downloadSongAsJson} from "../../../core/helper/MidiHelper.ts";
import type {Song} from "../../../core/model/Song.ts";
import {translateSongTitle, useI18n} from "../../../i18n.tsx";

interface MidiExporterProps {
    song: Song | null;
}

export default function MidiExporter({song}: MidiExporterProps) {
    const {t} = useI18n();

    const handleExportMidi = () => {
        if (!song) return;
        try {
            downloadSongAsMidi(song);
        } catch (err) {
            console.error("Failed to export MIDI:", err);
            alert(t("midiExport.failedMidi"));
        }
    };

    const handleExportJson = () => {
        if (!song) return;
        try {
            downloadSongAsJson(song);
        } catch (err) {
            console.error("Failed to export JSON:", err);
            alert(t("midiExport.failedJson"));
        }
    };

    return (
        <div className={style.MidiExporter}>
            <div className={style.Section}>
                <h3>{t("midiExport.title")}</h3>
                {song ? (
                    <>
                        <p>
                            {t("midiExport.exporting", {title: translateSongTitle(song.title, t), count: song.notes.length})}
                        </p>

                        <div className={style.ButtonGroup}>
                            <button
                                className={`${style.Button} ${style.Primary}`}
                                onClick={handleExportMidi}
                                title={t("midiExport.midiTitle")}
                            >
                                {t("midiExport.midi")}
                            </button>
                            <button
                                className={`${style.Button} ${style.Secondary}`}
                                onClick={handleExportJson}
                                title={t("midiExport.jsonTitle")}
                            >
                                {t("midiExport.json")}
                            </button>
                        </div>

                        <div className={style.Info}>
                            <h4>{t("midiExport.formats")}</h4>
                            <div className={style.FormatInfo}>
                                <div>
                                    <strong>{t("midiExport.midiFormat")}</strong>
                                    <p>{t("midiExport.midiDescription")}</p>
                                </div>
                                <div>
                                    <strong>JSON</strong>
                                    <p>{t("midiExport.jsonDescription")}</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={style.NoSong}>
                        <p>{t("midiExport.noSong")}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
