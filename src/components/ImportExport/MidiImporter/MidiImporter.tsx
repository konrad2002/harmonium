import {useState} from "react";
import style from "./MidiImporter.module.scss";
import {loadSongFromMidi} from "../../../core/helper/MidiHelper.ts";
import type {Song} from "../../../core/model/Song.ts";
import type {HarmoniumTone} from "../../../core/model/HarmoniumTone.ts";

interface MidiImporterProps {
    availableTones: HarmoniumTone[];
    onSongImported?: (song: Song) => void;
}

export default function MidiImporter({availableTones, onSongImported}: MidiImporterProps) {
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
            setSuccessMessage(`Imported "${song.title}" with ${song.notes.length} notes`);
            onSongImported?.(song);

            // Clear the file input
            e.target.value = "";
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={style.MidiImporter}>
            <div className={style.Section}>
                <h3>Import MIDI File</h3>
                <p>
                    Select a MIDI file to import. Notes will be automatically mapped to the
                    closest harmonium tones.
                </p>

                <label className={style.FileInput}>
                    <input
                        type="file"
                        accept=".mid,.midi"
                        onChange={handleFileSelect}
                        disabled={isLoading}
                    />
                    <span className={style.Label}>
                        {isLoading ? "Loading..." : "Choose MIDI File"}
                    </span>
                </label>

                {error && <div className={style.Error}>{error}</div>}
                {successMessage && <div className={style.Success}>{successMessage}</div>}
            </div>

            <div className={style.Info}>
                <h4>How it works</h4>
                <ul>
                    <li>MIDI notes are automatically mapped to the closest harmonium tone frequencies</li>
                    <li>The harmonium uses a non-12-TET tuning system for richer sounds</li>
                    <li>Each MIDI note is matched to the nearest available tone</li>
                    <li>BPM and timing information is preserved from the MIDI file</li>
                </ul>
            </div>
        </div>
    );
}
