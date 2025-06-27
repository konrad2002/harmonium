import style from "./Keyboard.module.scss";

export default function Keyboard() {


  function getName(i: number): string {
    let names = ["C", "Cis/Des", "D", "Dis/Es", "E", "F", "Fis/Ges", "G", "Gis/As", "A", "Ais/b", "H"];
    return names[i % 12];
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
    <>
      <div>
        {keys}
      </div>
    </>
  )
}