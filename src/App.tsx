import {useState} from "react";
import AppHeader from "./components/AppShell/AppHeader/AppHeader.tsx";
import ViewNav, {type AppView} from "./components/AppShell/ViewNav/ViewNav.tsx";
import PlayView from "./components/views/PlayView/PlayView.tsx";
import ComposeView from "./components/views/ComposeView/ComposeView.tsx";

function App() {
  const [activeView, setActiveView] = useState<AppView>("play");

  return (
    <>
      <AppHeader/>
      <ViewNav activeView={activeView} onSelectView={setActiveView}/>
      {activeView === "play" && <PlayView/>}
      {activeView === "compose" && <ComposeView/>}
    </>
  )
}

export default App
