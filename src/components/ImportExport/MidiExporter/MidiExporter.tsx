import style from "./MidiExporter.module.scss";
import {downloadSongAsMidi, downloadSongAsJson} from "../../../core/helper/MidiHelper.ts";
import type {Song} from "../../../core/model/Song.ts";

interface MidiExporterProps {
    song: Song | null;
}

export default function MidiExporter({song}: MidiExporterProps) {
    const handleExportMidi = () => {
        if (!song) return;
        try {
            downloadSongAsMidi(song);
        } catch (err) {
            console.error("Failed to export MIDI:", err);
            alert("Failed to export as MIDI");
        }
    };

    const handleExportJson = () => {
        if (!song) return;
        try {
            downloadSongAsJson(song);
        } catch (err) {
            console.error("Failed to export JSON:", err);
            alert("Failed to export as JSON");
        }
    };

    return (
        <div className={style.MidiExporter}>
            <div className={style.Section}>
                <h3>Export Song</h3>
                {song ? (
                    <>
                        <p>
                            Exporting: <strong>{song.title}</strong> ({song.notes.length} notes)
                        </p>

                        <div className={style.ButtonGroup}>
                            <button
                                className={`${style.Button} ${style.Primary}`}
                                onClick={handleExportMidi}
                                title="Export as MIDI file (.mid)"
                            >
                                📥 Export as MIDI
                            </button>
                            <button
                                className={`${style.Button} ${style.Secondary}`}
                                onClick={handleExportJson}
                                title="Export as JSON project file"
                            >
                                📥 Export as JSON
                            </button>
                        </div>

                        <div className={style.Info}>
                            <h4>Export formats</h4>
                            <div className={style.FormatInfo}>
                                <div>
                                    <strong>MIDI (.mid)</strong>
                                    <p>
                                        Standard MIDI format compatible with DAWs and other music
                                        software. Harmonium frequencies are mapped to the closest
                                        MIDI notes (12-TET).
                                    </p>
                                </div>
                                <div>
                                    <strong>JSON</strong>
                                    <p>
                                        Harmonium-native format preserving exact frequencies and all
                                        metadata. Can be re-imported to continue editing without
                                        frequency loss.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={style.NoSong}>
                        <p>No song loaded. Create or import a song in the Compose or Import tabs.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
