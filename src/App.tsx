import {useState} from "react";
import AppHeader from "./components/AppShell/AppHeader/AppHeader.tsx";
import ViewNav, {type AppView} from "./components/AppShell/ViewNav/ViewNav.tsx";
import PlaceholderView from "./components/AppShell/PlaceholderView/PlaceholderView.tsx";
import PlayView from "./components/views/PlayView/PlayView.tsx";

function App() {
  const [activeView, setActiveView] = useState<AppView>("play");

  return (
    <>
      <AppHeader/>
      <ViewNav activeView={activeView} onSelectView={setActiveView}/>
      {activeView === "play" && <PlayView/>}
      {activeView === "compose" && <PlaceholderView title="Compose"/>}
      {activeView === "import-export" && <PlaceholderView title="Import / Export"/>}
    </>
  )
}

export default App
