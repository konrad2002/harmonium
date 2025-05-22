import ManualKey from "../ManualKey/ManualKey.tsx";
import style from "./Manual.module.scss";
import ManualKeySpacer from "../ManualKeySpacer/ManualKeySpacer.tsx";

export default function Manual() {

  function getColor(i: number, j: number): "red" | "blue" | "white" | "yellow" {
    return ["white", "blue", "yellow", "red"][((i % 3 == 0 ? 3 : 0) + j + 2*i + ((i - (i % 3)) / 3 )) % 4] as "red" | "blue" | "white" | "yellow";
  }

  const buttons = [];

  for (let i = 0; i < 56; i++) {
    const row = [];

    row.push(<ManualKeySpacer size={[1, 3, 2][i % 3] as 1 | 2 | 3} />);

    for (let j = 0; j < (i % 3 === 0 ? 5 : 4); j++) {
      // color patter:
      // R W B G R G R W B W B G R G R W B G B G R W R W B G B G R W B W B G R G R W B
      row.push(<ManualKey key={j} keyColor={getColor(i, j)} />);
    }

    row.push(<ManualKeySpacer size={[1, 2, 3][i % 3] as 1 | 2 | 3} />);

    buttons.push(
      <div className={style.ManualKeyRow} key={i}>
        {row}
      </div>
    );
  }

  return (
    <>
      {buttons}
    </>
  )
}