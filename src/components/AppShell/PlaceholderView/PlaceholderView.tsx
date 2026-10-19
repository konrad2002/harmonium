import style from "./PlaceholderView.module.scss";
import {useI18n} from "../../../i18n.tsx";

type PlaceholderViewProps = {
    title: string;
};

// Shared "not built yet" placeholder for views covered by later plan phases.
export default function PlaceholderView({title}: PlaceholderViewProps) {
    const {t} = useI18n();

    return (
        <div className={style.PlaceholderView}>
            <h2>{title}</h2>
            <p>{t("placeholder.comingSoon")}</p>
        </div>
    );
}
