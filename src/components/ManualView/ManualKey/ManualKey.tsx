import styles from './ManualKey.module.scss';
import type {HarmoniumTone} from "../../../core/model/HarmoniumTone.ts";
import type {MouseEventHandler} from "react";

type ManualKeyProps = {
  keyColor: "red" | "blue" | "white" | "yellow";
  tone: HarmoniumTone;
  onMouseDown?: MouseEventHandler<HTMLDivElement>;
  onMouseUp?: MouseEventHandler<HTMLDivElement>;
};

export default function ManualKey({keyColor, tone, onMouseDown, onMouseUp} : ManualKeyProps) {

  const colors = {
    red: "var(--manual-key-red)",
    blue: "var(--manual-key-blue)",
    white: "var(--manual-key-white)",
    yellow: "var(--manual-key-yellow)"
  }

  return (
    <>
      <div style={{backgroundColor: colors[keyColor]}} className={styles.ManualKey} onMouseDown={onMouseDown}
           onMouseUp={onMouseUp}>
        <span className={styles.ManualKeyText}>{tone.name}</span>
      </div>
    </>
  )
}