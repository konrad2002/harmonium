import styles from './ManualKey.module.scss';
import type {HarmoniumTone} from "../../../core/model/HarmoniumTone.ts";
import type {MouseEventHandler, TouchEventHandler} from "react";

type ManualKeyProps = {
  keyColor: "red" | "blue" | "white" | "yellow";
  tone: HarmoniumTone;
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

  return (
    <>
      <div
        style={{backgroundColor: colors[keyColor]}}
        className={`${styles.ManualKey} ${pressed ? styles.ManualKeyPressed : ""}`}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <span className={styles.ManualKeyText}>{tone.name}</span>
      </div>
    </>
  )
}