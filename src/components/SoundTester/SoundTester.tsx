import useOscillator from "../../hooks/useOscillator.ts";
import {useRef, useState} from "react";

export default function SoundTester() {
  const [frequency, setFrequency] = useState(400);
  const timeoutRef = useRef<number | undefined>(undefined); // Use useRef to persist timeout
  const oscillatorRef = useRef(useOscillator({ frequency, type: "sine" })); // Persist oscillator

  function setValue() {
    timeoutRef.current = 10; // Update the ref value
  }

  function getValue() {
    console.log(timeoutRef.current)
  }


  function playTone() {
    oscillatorRef.current.start();
  }

  function startTone() {
    playTone();

    timeoutRef.current = setInterval(() => {
      setFrequency((prevFrequency) => {
        const newFrequency = prevFrequency + 50; // Calculate the new frequency
        oscillatorRef.current.set({ frequency: newFrequency }); // Update the oscillator with the new frequency
        return newFrequency; // Update the state
      });
    }, 50);
    console.log("after start", timeoutRef.current)
  }

  function stopTone() {
    console.log("stop", timeoutRef.current)
    if (timeoutRef.current) {
      clearInterval(timeoutRef.current as number);
      timeoutRef.current = undefined;
    }
    oscillatorRef.current.stop();
  }

  function playToneFrequency(frequency: number) {
    oscillatorRef.current.set({frequency: frequency});
    playTone();
  }

  return (
    <>
      <button onMouseDown={playTone} onMouseUp={stopTone}>Play Tone</button>
      <button onClick={startTone}>Start</button>
      <button onClick={stopTone}>Stop</button>
      <button onClick={setValue}>Set Value</button>
      <button onClick={getValue}>Get Value</button>
      <p>{frequency} Hz</p>

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