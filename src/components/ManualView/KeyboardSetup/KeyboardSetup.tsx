import style from "./KeyboardSetup.module.scss";
import type {HarmoniumTone} from "../../../core/model/HarmoniumTone.ts";
import {MAX_OCTAVE, MIN_OCTAVE, resolveSlot} from "../../../core/data/KeyboardMapping.ts";
import type {KeyColour} from "../../../core/data/RegisterConfiguration.ts";
import {useKeyboardSetup} from "../../../hooks/useKeyboardSetup.ts";
import {useI18n} from "../../../i18n.tsx";

const ROWS: string[][] = [
    ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0"],
    ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP"],
    ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon"],
    ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash"],
];

const SYMBOLS: Record<string, string> = {Semicolon: ";", Comma: ",", Period: ".", Slash: "/"};

const COLOURS: KeyColour[] = ["yellow", "blue", "red", "white"];

const codeLabel = (code: string) => SYMBOLS[code] ?? code.replace(/^(Key|Digit)/, "");

type KeyboardSetupProps = {
    // Tone of every manual key (null = unassigned)
    keyTones: (HarmoniumTone | null)[];
    // The computer key waiting for a manual key to be assigned to it
    assigningCode: string | null;
    onAssigningChange: (code: string | null) => void;
    message: string | null;
};

/** Choose the octave and which manual key each computer key plays. */
export default function KeyboardSetup({keyTones, assigningCode, onAssigningChange, message}: KeyboardSetupProps) {
    const {t} = useI18n();
    const {octave, mapping, shiftOctave, unassign, resetLayout} = useKeyboardSetup();

    return (
        <div className={style.KeyboardSetup}>
            <div className={style.Row}>
                <div className={style.Group}>
                    <button type="button" className={style.Button} onClick={() => shiftOctave(-1)} disabled={octave <= MIN_OCTAVE} aria-label={t("keyboard.octaveDown")}>
                        −
                    </button>
                    <span className={style.Octave}>{t("keyboard.octave", {octave})}</span>
                    <button type="button" className={style.Button} onClick={() => shiftOctave(1)} disabled={octave >= MAX_OCTAVE} aria-label={t("keyboard.octaveUp")}>
                        +
                    </button>
                </div>
                <div className={style.Group}>
                    <span>{t("keyboard.layoutFor")}</span>
                    {COLOURS.map(colour => (
                        <button
                            key={colour}
                            type="button"
                            className={style.Button}
                            style={{borderColor: `var(--manual-key-${colour})`}}
                            onClick={() => {
                                resetLayout(colour);
                                onAssigningChange(null);
                            }}
                        >
                            {t(`colour.${colour}`)}
                        </button>
                    ))}
                </div>
            </div>

            <div className={style.Keyboard}>
                {ROWS.map((row, i) => (
                    <div key={i} className={style.KeyRow} style={{marginLeft: i * 14}}>
                        {row.map(code => {
                            const slot = mapping[code];
                            const key = slot ? resolveSlot(slot, octave, keyTones) : null;

                            return (
                                <button
                                    key={code}
                                    type="button"
                                    className={`${style.Cap} ${code === assigningCode ? style.CapSelected : ""}`}
                                    onClick={() => onAssigningChange(code === assigningCode ? null : code)}
                                >
                                    <span className={style.CapLabel}>{codeLabel(code)}</span>
                                    <span
                                        className={`${style.CapTone} ${slot ? "" : style.CapEmpty}`}
                                        style={slot ? {backgroundColor: `var(--manual-key-${slot.colour})`} : undefined}
                                    >
                                        {slot ? (key === null ? "–" : keyTones[key]?.name) : ""}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div className={style.Hint}>
                {assigningCode ? t("keyboard.assignHint", {key: codeLabel(assigningCode), first: octave, last: octave + 2}) : t("keyboard.help")}
                {assigningCode && mapping[assigningCode] && (
                    <button
                        type="button"
                        className={style.Button}
                        onClick={() => {
                            unassign(assigningCode);
                            onAssigningChange(null);
                        }}
                    >
                        {t("keyboard.unassign")}
                    </button>
                )}
            </div>
            {message && <div className={style.Message} role="status">{message}</div>}
        </div>
    );
}
