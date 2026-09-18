import {useState} from "react";
import style from "./ImportExportView.module.scss";
import MidiImporter from "../../ImportExport/MidiImporter/MidiImporter.tsx";
import MidiExporter from "../../ImportExport/MidiExporter/MidiExporter.tsx";
import type {Song} from "../../../core/model/Song.ts";
import type {HarmoniumTone} from "../../../core/model/HarmoniumTone.ts";

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

    return (
        <div className={style.ImportExportView}>
            {/* Header */}
            <div className={style.Header}>
                <h1>Import / Export</h1>
                <p>Transfer songs between Harmonium and other applications</p>
            </div>

            {/* Tab navigation */}
            <div className={style.TabNav}>
                <button
                    className={`${style.TabButton} ${activeTab === "import" ? style.Active : ""}`}
                    onClick={() => setActiveTab("import")}
                >
                    📥 Import
                </button>
                <button
                    className={`${style.TabButton} ${activeTab === "export" ? style.Active : ""}`}
                    onClick={() => setActiveTab("export")}
                >
                    📤 Export
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
                <h2>About Import/Export</h2>
                <div className={style.InfoGrid}>
                    <div className={style.InfoCard}>
                        <h3>MIDI Support</h3>
                        <p>
                            Import standard MIDI files from any DAW or music software. MIDI notes are
                            automatically mapped to the closest harmonium tones. Export your compositions
                            as MIDI for use in other applications.
                        </p>
                    </div>
                    <div className={style.InfoCard}>
                        <h3>JSON Projects</h3>
                        <p>
                            Save songs as JSON to preserve exact harmonium frequencies and all editing
                            data. JSON files can be re-imported without any frequency loss or
                            approximation.
                        </p>
                    </div>
                    <div className={style.InfoCard}>
                        <h3>Non-12-TET Tuning</h3>
                        <p>
                            The Eitz Harmonium uses a special tuning system (not equal temperament).
                            When exporting to MIDI, frequencies are mapped to the closest 12-TET notes
                            for compatibility.
                        </p>
                    </div>
                    <div className={style.InfoCard}>
                        <h3>Pitch Mapping</h3>
                        <p>
                            Import uses intelligent frequency-matching to find the closest harmonium
                            tone for each MIDI note. This preserves the musical intent while adapting
                            to the harmonium's unique tuning.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
