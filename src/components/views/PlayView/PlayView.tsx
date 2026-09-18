import style from "./PlayView.module.scss";
import keysTopImage from "../../../assets/pictures/keys_top.jpg";
import Keyboard from "../../KeyboardView/Keyboard/Keyboard.tsx";
import Manual from "../../ManualView/Manual/Manual.tsx";

export default function PlayView() {
    return (
        <>
            <div className={style.ManualContainer}>
                <Keyboard/>
                <Manual layout="original"/>
                <hr/>
                <Manual layout="compact"/>
            </div>
            <hr/>
            <h2>Picture</h2>
            <img src={keysTopImage} alt="image of keys"/>
        </>
    );
}
