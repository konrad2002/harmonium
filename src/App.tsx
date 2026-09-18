import {useState, useEffect} from "react";
import AppHeader from "./components/AppShell/AppHeader/AppHeader.tsx";
import ViewNav, {type AppView} from "./components/AppShell/ViewNav/ViewNav.tsx";
import PlayView from "./components/views/PlayView/PlayView.tsx";
import ComposeView from "./components/views/ComposeView/ComposeView.tsx";
import ImportExportView from "./components/views/ImportExportView/ImportExportView.tsx";
import {parseCSV} from "./core/helper/CsvHelper.ts";
import {loadCurrentSong, saveCurrentSong} from "./core/helper/StorageHelper.ts";
import type {HarmoniumTone} from "./core/model/HarmoniumTone.ts";
import type {Song} from "./core/model/Song.ts";

function App() {
  const baseFrequency = 261.63;
  const [activeView, setActiveView] = useState<AppView>("play");
  const [tones, setTones] = useState<HarmoniumTone[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  // Load harmonium tones
  useEffect(() => {
    fetch("/tones_min.csv")
      .then(res => res.text())
      .then(text => {
        const parsed = parseCSV(text, baseFrequency);
        setTones(parsed);
      })
      .catch(err => console.error("Failed to load tones:", err));

    // Load current song from localStorage
    const saved = loadCurrentSong();
    if (saved) {
      setCurrentSong(saved);
    }
  }, []);

  // Save current song to localStorage when it changes
  useEffect(() => {
    if (currentSong) {
      saveCurrentSong(currentSong);
    }
  }, [currentSong]);

  const handleSongImported = (song: Song) => {
    setCurrentSong(song);
    setActiveView("compose");
  };

  return (
    <>
      <AppHeader/>
      <ViewNav activeView={activeView} onSelectView={setActiveView}/>
      {activeView === "play" && <PlayView/>}
      {activeView === "compose" && <ComposeView availableTones={tones}/>}
      {activeView === "import-export" && (
        <ImportExportView
          availableTones={tones}
          currentSong={currentSong}
          onSongImported={handleSongImported}
        />
      )}
    </>
  )
}

export default App
