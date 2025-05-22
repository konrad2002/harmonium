import style from "./ManualKeySpacer.module.scss";

type ManualKeySpacerProps = {
  size: 1 | 2 | 3;
};

export default function ManualKeySpacer({ size }: ManualKeySpacerProps) {
  return (
    <div className={`${style.Spacer} ${style[`Spacer${size}`]}`} />
  );
}
