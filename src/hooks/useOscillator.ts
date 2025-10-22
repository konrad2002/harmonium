import {useRef} from "react";
import {Oscillator} from "tone";
import type {ToneOscillatorConstructorOptions} from "tone/build/esm/source/oscillator/OscillatorInterface";

export default function useOscillator(options?: Partial<ToneOscillatorConstructorOptions>): Oscillator {
  const oscillator = useRef<Oscillator>(
    new Oscillator(options).toDestination()
  );

  return oscillator.current;
}