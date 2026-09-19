import style from "./RegisterSelector.module.scss";
import type {Register} from "../../../core/data/RegisterConfiguration.ts";

interface RegisterSelectorProps {
    registers: Register[];
    activeRegisterIds: number[];
    onToggleRegister: (registerId: number, colour: string) => void;
}

/**
 * Register selector component showing 8 round buttons in a single row,
 * ordered by register id, coloured by their colour group.
 */
export default function RegisterSelector({
    registers,
    activeRegisterIds,
    onToggleRegister,
}: RegisterSelectorProps) {
    const sortedRegisters = [...registers].sort((a, b) => a.id - b.id);

    return (
        <div className={style.RegisterSelector}>
            <h3 className={style.Title}>Registers</h3>

            <div className={style.RegisterRow}>
                {sortedRegisters.map(register => (
                    <div key={register.id} className={style.RegisterItem}>
                        <div className={style.RegisterNumber}>{register.register}</div>
                        <button
                            className={`${style.RegisterButton} ${
                                activeRegisterIds.includes(register.id) ? style.Active : ""
                            } ${style[`Color_${register.colour}`]}`}
                            onClick={() => onToggleRegister(register.id, register.colour)}
                            title={`${register.label} (${register.register})`}
                        >
                            <div className={style.RegisterLabel}>{register.label}</div>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
