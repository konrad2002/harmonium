import {useRef} from "react";
import {Oscillator} from "tone";

export default function useOscillator(options): Oscillator {
  const oscillator = useRef<Oscillator>(
    new Oscillator(options).toDestination()
  );

  return oscillator.current;
}