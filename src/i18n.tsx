/* eslint-disable react-refresh/only-export-components */
import {createContext, useContext, useEffect, useState, type ReactNode} from "react";
import {useCallback} from "react";

export type Language = "en" | "de";

const english = {
    "app.title": "Eitz Harmonium",
    "language.label": "Language",
    "language.english": "English",
    "language.german": "German",
    "keyboard.note0": "C",
    "keyboard.note1": "C#/Db",
    "keyboard.note2": "D",
    "keyboard.note3": "D#/Eb",
    "keyboard.note4": "E",
    "keyboard.note5": "F",
    "keyboard.note6": "F#/Gb",
    "keyboard.note7": "G",
    "keyboard.note8": "G#/Ab",
    "keyboard.note9": "A",
    "keyboard.note10": "A#/Bb",
    "keyboard.note11": "B",
    "theme.toggle": "Toggle color theme",
    "theme.light": "☀ Light",
    "theme.dark": "☾ Dark",
    "navigation.play": "Play",
    "navigation.compose": "Compose",
    "navigation.importExport": "Import / Export",
    "song.presetLabel": "Pre-programmed piece:",
    "song.selectPlaceholder": "-- Select a song --",
    "song.simpleMelody": "Simple Melody",
    "song.chordProgression": "Chord Progression",
    "playback.stop": "⏹ Stop",
    "playback.stopAria": "Stop playback",
    "playback.pause": "⏸ Pause",
    "playback.pauseAria": "Pause playback",
    "playback.play": "▶ Play",
    "playback.playAria": "Play",
    "playback.seek": "Seek position",
    "sound.label": "Sound",
    "sound.synth": "Synthesizer",
    "sound.sample": "Recorded sample",
    "sound.loading": "loading…",
    "sound.unavailable": "unavailable: {{message}}",
    "sound.retry": "retry",
    "volume.label": "Volume",
    "compose.editDone": "✓ Done editing",
    "compose.edit": "✎ Edit",
    "compose.hint": "Select a key, then click its highlighted column to add a note. Drag a note to move it, drag its top or bottom edge to resize it, press Delete to remove it.",
    "register.title": "Registers",
    "importExport.description": "Transfer songs between Harmonium and other applications",
    "importExport.import": "📥 Import",
    "importExport.export": "📤 Export",
    "importExport.about": "About Import/Export",
    "importExport.midiSupport": "MIDI Support",
    "importExport.midiSupportDescription": "Import standard MIDI files from any DAW or music software. MIDI notes are automatically mapped to the closest harmonium tones. Export your compositions as MIDI for use in other applications.",
    "importExport.jsonProjects": "JSON Projects",
    "importExport.jsonDescription": "Save songs as JSON to preserve exact harmonium frequencies and all editing data. JSON files can be re-imported without any frequency loss or approximation.",
    "importExport.tuning": "Non-12-TET Tuning",
    "importExport.tuningDescription": "The Eitz Harmonium uses a special tuning system (not equal temperament). When exporting to MIDI, frequencies are mapped to the closest 12-TET notes for compatibility.",
    "importExport.pitchMapping": "Pitch Mapping",
    "importExport.pitchDescription": "Import uses intelligent frequency-matching to find the closest harmonium tone for each MIDI note. This preserves the musical intent while adapting to the harmonium's unique tuning.",
    "midiImport.title": "Import MIDI File",
    "midiImport.description": "Select a MIDI file to import. Notes will be automatically mapped to the closest harmonium tones.",
    "midiImport.loading": "Loading...",
    "midiImport.chooseFile": "Choose MIDI File",
    "midiImport.howItWorks": "How it works",
    "midiImport.mapping": "MIDI notes are automatically mapped to the closest harmonium tone frequencies",
    "midiImport.tuning": "The harmonium uses a non-12-TET tuning system for richer sounds",
    "midiImport.matching": "Each MIDI note is matched to the nearest available tone",
    "midiImport.timing": "BPM and timing information is preserved from the MIDI file",
    "midiImport.success": "Imported \"{{title}}\" with {{count}} notes",
    "midiImport.unknownError": "Unknown error",
    "midiExport.title": "Export Song",
    "midiExport.exporting": "Exporting: {{title}} ({{count}} notes)",
    "midiExport.midiTitle": "Export as MIDI file (.mid)",
    "midiExport.jsonTitle": "Export as JSON project file",
    "midiExport.midi": "📥 Export as MIDI",
    "midiExport.json": "📥 Export as JSON",
    "midiExport.formats": "Export formats",
    "midiExport.midiFormat": "MIDI (.mid)",
    "midiExport.midiDescription": "Standard MIDI format compatible with DAWs and other music software. Harmonium frequencies are mapped to the closest MIDI notes (12-TET).",
    "midiExport.jsonDescription": "Harmonium-native format preserving exact frequencies and all metadata. Can be re-imported to continue editing without frequency loss.",
    "midiExport.noSong": "No song loaded. Create or import a song in the Compose or Import tabs.",
    "midiExport.failedMidi": "Failed to export as MIDI",
    "midiExport.failedJson": "Failed to export as JSON",
    "placeholder.comingSoon": "This view is coming in a future phase.",
} as const;

type TranslationKey = keyof typeof english;
type TranslationValues = Record<string, string | number>;
type Translator = (key: TranslationKey, values?: TranslationValues) => string;

const german: Record<TranslationKey, string> = {
    "app.title": "Eitz Harmonium",
    "language.label": "Sprache",
    "language.english": "Englisch",
    "language.german": "Deutsch",
    "keyboard.note0": "C",
    "keyboard.note1": "Cis/Des",
    "keyboard.note2": "D",
    "keyboard.note3": "Dis/Es",
    "keyboard.note4": "E",
    "keyboard.note5": "F",
    "keyboard.note6": "Fis/Ges",
    "keyboard.note7": "G",
    "keyboard.note8": "Gis/As",
    "keyboard.note9": "A",
    "keyboard.note10": "Ais/B",
    "keyboard.note11": "H",
    "theme.toggle": "Farbschema umschalten",
    "theme.light": "☀ Hell",
    "theme.dark": "☾ Dunkel",
    "navigation.play": "Spielen",
    "navigation.compose": "Komponieren",
    "navigation.importExport": "Import / Export",
    "song.presetLabel": "Voreingestelltes Stück:",
    "song.selectPlaceholder": "-- Stück auswählen --",
    "song.simpleMelody": "Einfache Melodie",
    "song.chordProgression": "Akkordfolge",
    "playback.stop": "⏹ Stopp",
    "playback.stopAria": "Wiedergabe stoppen",
    "playback.pause": "⏸ Pause",
    "playback.pauseAria": "Wiedergabe pausieren",
    "playback.play": "▶ Abspielen",
    "playback.playAria": "Abspielen",
    "playback.seek": "Wiedergabeposition",
    "sound.label": "Klang",
    "sound.synth": "Synthesizer",
    "sound.sample": "Aufnahme",
    "sound.loading": "wird geladen…",
    "sound.unavailable": "nicht verfügbar: {{message}}",
    "sound.retry": "erneut versuchen",
    "volume.label": "Lautstärke",
    "compose.editDone": "✓ Bearbeitung beenden",
    "compose.edit": "✎ Bearbeiten",
    "compose.hint": "Wähle eine Taste aus und klicke dann auf die hervorgehobene Spalte, um eine Note hinzuzufügen. Ziehe eine Note, um sie zu verschieben, ziehe an ihrer oberen oder unteren Kante, um ihre Länge anzupassen, oder drücke Entf, um sie zu löschen.",
    "register.title": "Register",
    "importExport.description": "Stücke zwischen Harmonium und anderen Anwendungen übertragen",
    "importExport.import": "📥 Importieren",
    "importExport.export": "📤 Exportieren",
    "importExport.about": "Über Import / Export",
    "importExport.midiSupport": "MIDI-Unterstützung",
    "importExport.midiSupportDescription": "Importiere Standard-MIDI-Dateien aus jeder DAW oder Musiksoftware. MIDI-Noten werden automatisch den nächstgelegenen Harmoniumtönen zugeordnet. Exportiere deine Kompositionen als MIDI zur Verwendung in anderen Anwendungen.",
    "importExport.jsonProjects": "JSON-Projekte",
    "importExport.jsonDescription": "Speichere Stücke als JSON, um exakte Harmoniumfrequenzen und alle Bearbeitungsdaten zu erhalten. JSON-Dateien können ohne Frequenzverlust oder Näherung erneut importiert werden.",
    "importExport.tuning": "Nicht-12-TET-Stimmung",
    "importExport.tuningDescription": "Das Eitz Harmonium verwendet ein spezielles Stimmungssystem (keine gleichstufige Stimmung). Beim MIDI-Export werden Frequenzen aus Kompatibilitätsgründen den nächstgelegenen 12-TET-Noten zugeordnet.",
    "importExport.pitchMapping": "Tonhöhenzuordnung",
    "importExport.pitchDescription": "Beim Import wird jeder MIDI-Note anhand eines intelligenten Frequenzabgleichs der nächstgelegene Harmoniumton zugeordnet. So bleibt die musikalische Absicht erhalten und wird an die einzigartige Stimmung des Harmoniums angepasst.",
    "midiImport.title": "MIDI-Datei importieren",
    "midiImport.description": "Wähle eine MIDI-Datei zum Importieren aus. Die Noten werden automatisch den nächstgelegenen Harmoniumtönen zugeordnet.",
    "midiImport.loading": "Wird geladen...",
    "midiImport.chooseFile": "MIDI-Datei auswählen",
    "midiImport.howItWorks": "So funktioniert es",
    "midiImport.mapping": "MIDI-Noten werden automatisch den nächstgelegenen Harmoniumfrequenzen zugeordnet",
    "midiImport.tuning": "Das Harmonium verwendet ein Nicht-12-TET-Stimmungssystem für einen volleren Klang",
    "midiImport.matching": "Jede MIDI-Note wird dem nächstgelegenen verfügbaren Ton zugeordnet",
    "midiImport.timing": "BPM- und Timing-Informationen der MIDI-Datei bleiben erhalten",
    "midiImport.success": "\"{{title}}\" mit {{count}} Noten importiert",
    "midiImport.unknownError": "Unbekannter Fehler",
    "midiExport.title": "Stück exportieren",
    "midiExport.exporting": "Wird exportiert: {{title}} ({{count}} Noten)",
    "midiExport.midiTitle": "Als MIDI-Datei exportieren (.mid)",
    "midiExport.jsonTitle": "Als JSON-Projektdatei exportieren",
    "midiExport.midi": "📥 Als MIDI exportieren",
    "midiExport.json": "📥 Als JSON exportieren",
    "midiExport.formats": "Exportformate",
    "midiExport.midiFormat": "MIDI (.mid)",
    "midiExport.midiDescription": "Standard-MIDI-Format, kompatibel mit DAWs und anderer Musiksoftware. Harmoniumfrequenzen werden den nächstgelegenen MIDI-Noten (12-TET) zugeordnet.",
    "midiExport.jsonDescription": "Harmonium-eigenes Format, das exakte Frequenzen und alle Metadaten erhält. Kann zum Weiterbearbeiten ohne Frequenzverlust erneut importiert werden.",
    "midiExport.noSong": "Kein Stück geladen. Erstelle oder importiere ein Stück im Komponieren- oder Import-Tab.",
    "midiExport.failedMidi": "MIDI-Export fehlgeschlagen",
    "midiExport.failedJson": "JSON-Export fehlgeschlagen",
    "placeholder.comingSoon": "Diese Ansicht wird in einer späteren Phase verfügbar sein.",
};

const LANGUAGE_STORAGE_KEY = "harmonium.language";

function getInitialLanguage(): Language {
    try {
        const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (stored === "en" || stored === "de") return stored;
    } catch (error) {
        console.warn("Could not read the saved language preference:", error);
    }
    return navigator.language.toLowerCase().startsWith("de") ? "de" : "en";
}

type I18nContextValue = {
    language: Language;
    setLanguage: (language: Language) => void;
    t: Translator;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({children}: {children: ReactNode}) {
    const [language, setLanguageState] = useState<Language>(getInitialLanguage);
    const dictionary = language === "de" ? german : english;

    const setLanguage = useCallback((nextLanguage: Language) => {
        setLanguageState(nextLanguage);
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
        } catch (error) {
            console.warn("Could not save the language preference:", error);
        }
    }, []);

    const t = useCallback<Translator>((key, values) => Object.entries(values ?? {}).reduce(
        (text, [name, value]) => text.replace(new RegExp(`\\{\\{${name}\\}\\}`, "g"), String(value)),
        dictionary[key],
    ), [dictionary]);

    useEffect(() => {
        document.documentElement.lang = language;
        document.title = t("app.title");
    }, [language, t]);

    return (
        <I18nContext.Provider value={{language, setLanguage, t}}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n(): I18nContextValue {
    const context = useContext(I18nContext);
    if (!context) throw new Error("useI18n must be used within I18nProvider");
    return context;
}

export function translateSongTitle(title: string, t: Translator): string {
    if (title === "Simple Melody") return t("song.simpleMelody");
    if (title === "Chord Progression") return t("song.chordProgression");
    return title;
}
