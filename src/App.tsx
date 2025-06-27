import style from './App.module.scss'
import keysTopImage from './assets/pictures/keys_top.jpg'
import SoundTester from "./components/SoundTester/SoundTester.tsx";
import TestComp from "./components/SoundTester/test.tsx";
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
      <Keyboard />
      <hr />
      <h2>Picture</h2>
      <img src={keysTopImage} alt="image of keys"/>
      <hr />
      <h2>Tone.js</h2>
      <SoundTester />
      <TestComp />
    </>
  )
}

export default App
