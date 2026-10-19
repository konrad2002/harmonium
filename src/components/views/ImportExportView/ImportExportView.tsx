import {useState} from "react";
import style from "./ImportExportView.module.scss";
import MidiImporter from "../../ImportExport/MidiImporter/MidiImporter.tsx";
import MidiExporter from "../../ImportExport/MidiExporter/MidiExporter.tsx";
import type {Song} from "../../../core/model/Song.ts";
import type {HarmoniumTone} from "../../../core/model/HarmoniumTone.ts";
import {useI18n} from "../../../i18n.tsx";

interface ImportExportViewProps {
    availableTones?: HarmoniumTone[];
    currentSong?: Song | null;
    onSongImported?: (song: Song) => void;
}

type Tab = "import" | "export";

export default function ImportExportView({
    availableTones = [],
    currentSong = null,
    onSongImported,
}: ImportExportViewProps) {
    const [activeTab, setActiveTab] = useState<Tab>("import");
    const {t} = useI18n();

    return (
        <div className={style.ImportExportView}>
            {/* Header */}
            <div className={style.Header}>
                <h1>{t("navigation.importExport")}</h1>
                <p>{t("importExport.description")}</p>
            </div>

            {/* Tab navigation */}
            <div className={style.TabNav}>
                <button
                    className={`${style.TabButton} ${activeTab === "import" ? style.Active : ""}`}
                    onClick={() => setActiveTab("import")}
                >
                    {t("importExport.import")}
                </button>
                <button
                    className={`${style.TabButton} ${activeTab === "export" ? style.Active : ""}`}
                    onClick={() => setActiveTab("export")}
                >
                    {t("importExport.export")}
                </button>
            </div>

            {/* Content */}
            <div className={style.Content}>
                {activeTab === "import" && (
                    <div className={style.TabContent}>
                        <MidiImporter
                            availableTones={availableTones}
                            onSongImported={onSongImported}
                        />
                    </div>
                )}

                {activeTab === "export" && (
                    <div className={style.TabContent}>
                        <MidiExporter song={currentSong || null} />
                    </div>
                )}
            </div>

            {/* Info section */}
            <div className={style.InfoSection}>
                <h2>{t("importExport.about")}</h2>
                <div className={style.InfoGrid}>
                    <div className={style.InfoCard}>
                        <h3>{t("importExport.midiSupport")}</h3>
                        <p>{t("importExport.midiSupportDescription")}</p>
                    </div>
                    <div className={style.InfoCard}>
                        <h3>{t("importExport.jsonProjects")}</h3>
                        <p>{t("importExport.jsonDescription")}</p>
                    </div>
                    <div className={style.InfoCard}>
                        <h3>{t("importExport.tuning")}</h3>
                        <p>{t("importExport.tuningDescription")}</p>
                    </div>
                    <div className={style.InfoCard}>
                        <h3>{t("importExport.pitchMapping")}</h3>
                        <p>{t("importExport.pitchDescription")}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
