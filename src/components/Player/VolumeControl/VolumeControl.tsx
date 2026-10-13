import {getDestination} from "tone";
import style from "./VolumeControl.module.scss";

// Controls the master volume, so it affects both manual playing and song playback.
export default function VolumeControl() {
    return (
        <label className={style.VolumeControl}>
            Volume
            <input
                type="range"
                min={-40}
                max={6}
                defaultValue={0}
                step={1}
                onChange={(e) => {
                    getDestination().volume.value = Number(e.target.value);
                }}
            />
        </label>
    );
}
