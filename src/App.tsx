import style from './App.module.scss'
import Manual from "./components/Manual/Manual.tsx";
import keysTopImage from './assets/pictures/keys_top.jpg'
import SoundTester from "./components/SoundTester/SoundTester.tsx";
import TestComp from "./components/SoundTester/test.tsx";

function App() {
  return (
    <>
      <div className={style.ManualContainer}>
        <Manual />
      </div>
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
