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
    red: "#d3674a",
    blue: "#1d308f",
    white: "#e4eef8",
    yellow: "#e6de60"
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