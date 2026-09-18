import style from './App.module.scss'
import keysTopImage from './assets/pictures/keys_top.jpg'
import Keyboard from "./components/KeyboardView/Keyboard/Keyboard.tsx";
import Manual from "./components/ManualView/Manual/Manual.tsx";

function App() {
  return (
    <>
      <div className={style.ManualContainer}>
        <Keyboard />
        <Manual layout="original" />
        <hr />
        <Manual layout="compact" />
      </div>
      <hr />
      <h2>Picture</h2>
      <img src={keysTopImage} alt="image of keys"/>
    </>
  )
}

export default App
