import style from "./Keyboard.module.scss";
import {useI18n} from "../../../i18n.tsx";

const NOTE_KEYS = [
  "keyboard.note0", "keyboard.note1", "keyboard.note2", "keyboard.note3",
  "keyboard.note4", "keyboard.note5", "keyboard.note6", "keyboard.note7",
  "keyboard.note8", "keyboard.note9", "keyboard.note10", "keyboard.note11",
] as const;

export default function Keyboard() {
  const {t} = useI18n();

  function getName(i: number): string {
    return t(NOTE_KEYS[i % 12]);
  }

  const keys = [];

  for (let j = 0; j < 56; j++) {
    const i = j + 5;
    // 1+ 2+ 3 1+ 2+ 2+ 3
    //1 a 2 a 3 1 a 2 a 2 a 3
    let className = "";
    if ([1,3,6,8,10].includes(i % 12)) {
      className = style.KeyBlack;
    } else {
      if ([2,7,9].includes(i % 12)) {
        className = style.KeyMiddle;
      }
    }

    keys.push(<div className={`${style.Key} ${className}`} key={j}>{getName(i)}</div>);
  }

  return (
    <div className={style.Keyboard}>
      {keys}
    </div>
  )
}