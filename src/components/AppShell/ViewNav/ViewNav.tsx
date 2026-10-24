import style from "./ViewNav.module.scss";
import {useI18n} from "../../../i18n.tsx";

export type AppView = "play" | "compose";

const VIEWS: { id: AppView }[] = [
    {id: "play"},
    {id: "compose"},
];

type ViewNavProps = {
    activeView: AppView;
    onSelectView: (view: AppView) => void;
};

export default function ViewNav({activeView, onSelectView}: ViewNavProps) {
    const {t} = useI18n();

    return (
        <nav className={style.ViewNav}>
            {VIEWS.map(view => (
                <button
                    key={view.id}
                    type="button"
                    className={`${style.ViewNavButton} ${view.id === activeView ? style.ViewNavButtonActive : ""}`}
                    onClick={() => onSelectView(view.id)}
                >
                    {view.id === "play" ? t("navigation.play") : t("navigation.compose")}
                </button>
            ))}
        </nav>
    );
}
