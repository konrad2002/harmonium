import styles from './ManualKey.module.scss';
import type {HarmoniumTone} from "../../../core/model/HarmoniumTone.ts";
import type {MouseEventHandler, TouchEventHandler} from "react";

type ManualKeyProps = {
  keyColor: "red" | "blue" | "white" | "yellow";
  // Null when no register is active for this key's colour: the key is unassigned and silent.
  tone: HarmoniumTone | null;
  pressed?: boolean;
  onMouseDown?: MouseEventHandler<HTMLDivElement>;
  onMouseUp?: MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: MouseEventHandler<HTMLDivElement>;
  onTouchStart?: TouchEventHandler<HTMLDivElement>;
  onTouchEnd?: TouchEventHandler<HTMLDivElement>;
};

export default function ManualKey({keyColor, tone, pressed, onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd} : ManualKeyProps) {

  const colors = {
    red: "var(--manual-key-red)",
    blue: "var(--manual-key-blue)",
    white: "var(--manual-key-white)",
    yellow: "var(--manual-key-yellow)"
  }

  const assigned = tone !== null;

  return (
    <>
      <div
        style={{backgroundColor: colors[keyColor]}}
        className={`${styles.ManualKey} ${pressed ? styles.ManualKeyPressed : ""} ${!assigned ? styles.ManualKeyUnassigned : ""}`}
        onMouseDown={assigned ? onMouseDown : undefined}
        onMouseUp={assigned ? onMouseUp : undefined}
        onMouseLeave={assigned ? onMouseLeave : undefined}
        onTouchStart={assigned ? onTouchStart : undefined}
        onTouchEnd={assigned ? onTouchEnd : undefined}
      >
        <span className={styles.ManualKeyText}>{assigned ? tone.name : ""}</span>
      </div>
    </>
  )
}