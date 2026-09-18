import style from "./TimelineRuler.module.scss";
import {formatTime} from "../../../core/helper/TimelineHelper.ts";

interface TimelineRulerProps {
    bpm: number;
    zoom: number; // pixels per beat
    duration: number; // total duration in seconds
    currentTime?: number; // optional playhead position in seconds
    onSeek?: (time: number) => void;
}

/**
 * Timeline ruler showing time/beat markers at the top of the timeline
 */
export default function TimelineRuler({
    bpm,
    zoom,
    duration,
    currentTime,
    onSeek,
}: TimelineRulerProps) {
    const beatDuration = 60 / bpm; // seconds per beat
    const totalBeats = duration / beatDuration;

    // Generate beat markers (every beat, every 4 beats, every 16 beats based on zoom)
    const markerInterval = zoom < 30 ? 16 : zoom < 60 ? 4 : 1; // beats between markers
    const markers: number[] = [];
    for (let beat = 0; beat <= totalBeats; beat += markerInterval) {
        markers.push(beat);
    }

    const handleClick = (beat: number) => {
        if (onSeek) {
            const time = beat * beatDuration;
            onSeek(time);
        }
    };

    return (
        <div className={style.TimelineRuler} style={{width: `${totalBeats * zoom}px`}}>
            <div className={style.Markers}>
                {markers.map(beat => {
                    const time = beat * beatDuration;
                    const pixelPosition = beat * zoom;
                    const isMajor = beat % 4 === 0;

                    return (
                        <div
                            key={beat}
                            className={`${style.Marker} ${isMajor ? style.MajorMarker : ""}`}
                            style={{left: `${pixelPosition}px`}}
                            onClick={() => handleClick(beat)}
                            title={formatTime(time)}
                        >
                            {isMajor && (
                                <span className={style.Label}>
                                    {formatTime(time)}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
            {currentTime !== undefined && (
                <div
                    className={style.Playhead}
                    style={{left: `${(currentTime / beatDuration) * zoom}px`}}
                />
            )}
        </div>
    );
}
