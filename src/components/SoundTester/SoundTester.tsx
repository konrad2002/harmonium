import useOscillator from "../../hooks/useOscillator.ts";
import {useState} from "react";

export default function SoundTester() {
  const [frequency, setFrequency] = useState(400);

  const oscillator = useOscillator({
    frequency: frequency, // Frequency in Hz
    type: "sine", // Waveform type
  });

  let timeout: number | null = null;

  function setValue() {
    timeout = 10;
  }

  function getValue() {
    console.log(timeout)
  }


  function playTone() {
    oscillator.start();
  }

  function startTone() {
    playTone();

    timeout = setInterval(() => {
      console.log(timeout)
      setFrequency((f) => f + 10)

      oscillator.set({frequency: frequency})
    }, 100);
    console.log("after start", timeout)
  }

  function stopTone() {
    console.log("stop", timeout)
    if (timeout) {
      clearInterval(timeout);
      timeout = null;
    }
    oscillator.stop();
  }

  function playToneFrequency(frequency: number) {
    oscillator.set({frequency: frequency});
    playTone();
  }

  return (
    <>
      <button onMouseDown={playTone} onMouseUp={stopTone}>Play Tone</button>
      <button onClick={startTone}>Start</button>
      <button onClick={stopTone}>Stop</button>
      <p>{frequency}</p>

      <button onMouseDown={() => playToneFrequency(261.626)} onMouseUp={stopTone}>C4</button>
      <button onMouseDown={() => playToneFrequency(293.665)} onMouseUp={stopTone}>D4</button>
      <button onMouseDown={() => playToneFrequency(329.628)} onMouseUp={stopTone}>E4</button>
      <button onMouseDown={() => playToneFrequency(349.228)} onMouseUp={stopTone}>F4</button>
      <button onMouseDown={() => playToneFrequency(392.000)} onMouseUp={stopTone}>G4</button>
      <button onMouseDown={() => playToneFrequency(440.000)} onMouseUp={stopTone}>A4</button>
      <button onMouseDown={() => playToneFrequency(493.883)} onMouseUp={stopTone}>B4</button>
    </>
  )
}