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
    "compose.fullscreen": "⛶ Fullscreen",
    "compose.exitFullscreen": "✕ Exit fullscreen",
    "compose.hint": "Select a key, then click its highlighted column to add a note. Drag a note to move it, drag its top or bottom edge to resize it, press Delete to remove it.",
    "compose.import": "📥 Import MIDI",
    "compose.export": "📤 Export MIDI",
    "compose.importConfirm": "Importing replaces the current composition. Continue?",
    "compose.imported": "Imported {{count}} notes.",
    "compose.importedWithSkipped": "Imported {{count}} notes. {{skipped}} notes were skipped because no key plays a matching tone with the current registers.",
    "compose.importFailed": "Import failed: {{message}}",
    "compose.exported": "Exported {{count}} notes.",
    "compose.exportedWithSkipped": "Exported {{count}} notes. {{skipped}} notes were skipped (keys without a tone in the current registers, out of MIDI range, or more than 16 notes at once).",
    "compose.tonesNotLoaded": "The tones are not loaded yet.",
    "play.empty": "There is no composition yet. Create or import one in the Compose view.",
    "register.title": "Registers",
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
    "compose.fullscreen": "⛶ Vollbild",
    "compose.exitFullscreen": "✕ Vollbild beenden",
    "compose.hint": "Wähle eine Taste aus und klicke dann auf die hervorgehobene Spalte, um eine Note hinzuzufügen. Ziehe eine Note, um sie zu verschieben, ziehe an ihrer oberen oder unteren Kante, um ihre Länge anzupassen, oder drücke Entf, um sie zu löschen.",
    "register.title": "Register",
    "compose.import": "📥 MIDI importieren",
    "compose.export": "📤 MIDI exportieren",
    "compose.importConfirm": "Der Import ersetzt die aktuelle Komposition. Fortfahren?",
    "compose.imported": "{{count}} Noten importiert.",
    "compose.importedWithSkipped": "{{count}} Noten importiert. {{skipped}} Noten wurden übersprungen, weil keine Taste mit den aktuellen Registern einen passenden Ton spielt.",
    "compose.importFailed": "Import fehlgeschlagen: {{message}}",
    "compose.exported": "{{count}} Noten exportiert.",
    "compose.exportedWithSkipped": "{{count}} Noten exportiert. {{skipped}} Noten wurden übersprungen (Tasten ohne Ton in den aktuellen Registern, außerhalb des MIDI-Bereichs oder mehr als 16 gleichzeitige Noten).",
    "compose.tonesNotLoaded": "Die Töne sind noch nicht geladen.",
    "play.empty": "Es gibt noch keine Komposition. Erstelle oder importiere eine in der Ansicht Komponieren.",
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
