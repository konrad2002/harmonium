import style from './App.module.scss'
import Manual from "./components/Manual/Manual.tsx";
import keysTopImage from './assets/pictures/keys_top.jpg'

function App() {
  return (
    <>
      <div className={style.ManualContainer}>
        <Manual />
      </div>
      <details>
        <summary>Picture</summary>
        <img src={keysTopImage} alt="image of keys"/>
      </details>
    </>
  )
}

export default App
