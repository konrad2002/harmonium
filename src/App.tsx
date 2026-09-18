import {useState, useEffect} from "react";
import AppHeader from "./components/AppShell/AppHeader/AppHeader.tsx";
import ViewNav, {type AppView} from "./components/AppShell/ViewNav/ViewNav.tsx";
import PlaceholderView from "./components/AppShell/PlaceholderView/PlaceholderView.tsx";
import PlayView from "./components/views/PlayView/PlayView.tsx";
import ComposeView from "./components/views/ComposeView/ComposeView.tsx";
import {parseCSV} from "./core/helper/CsvHelper.ts";
import type {HarmoniumTone} from "./core/model/HarmoniumTone.ts";

function App() {
  const baseFrequency = 261.63;
  const [activeView, setActiveView] = useState<AppView>("play");
  const [tones, setTones] = useState<HarmoniumTone[]>([]);

  // Load harmonium tones
  useEffect(() => {
    fetch("/tones_min.csv")
      .then(res => res.text())
      .then(text => {
        const parsed = parseCSV(text, baseFrequency);
        setTones(parsed);
      })
      .catch(err => console.error("Failed to load tones:", err));
  }, []);

  return (
    <>
      <AppHeader/>
      <ViewNav activeView={activeView} onSelectView={setActiveView}/>
      {activeView === "play" && <PlayView/>}
      {activeView === "compose" && <ComposeView availableTones={tones}/>}
      {activeView === "import-export" && <PlaceholderView title="Import / Export"/>}
    </>
  )
}

export default App
