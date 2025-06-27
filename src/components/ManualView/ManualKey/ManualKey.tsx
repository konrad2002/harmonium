import styles from './ManualKey.module.scss';

type ManualKeyProps = {
  keyColor: "red" | "blue" | "white" | "yellow";
  title: string;
};

export default function ManualKey({keyColor, title} : ManualKeyProps) {

  const colors = {
    red: "#d3674a",
    blue: "#1d308f",
    white: "#e4eef8",
    yellow: "#e6de60"
  }

  return (
    <>
      <div style={{backgroundColor: colors[keyColor]}} className={styles.ManualKey} title={title}>
        <span className={styles.ManualKeyText}>title</span>
      </div>
    </>
  )
}