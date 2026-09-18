import style from "./ViewNav.module.scss";

export type AppView = "play" | "compose" | "import-export";

const VIEWS: { id: AppView; label: string }[] = [
    {id: "play", label: "Play"},
    {id: "compose", label: "Compose"},
    {id: "import-export", label: "Import / Export"},
];

type ViewNavProps = {
    activeView: AppView;
    onSelectView: (view: AppView) => void;
};

export default function ViewNav({activeView, onSelectView}: ViewNavProps) {
    return (
        <nav className={style.ViewNav}>
            {VIEWS.map(view => (
                <button
                    key={view.id}
                    type="button"
                    className={`${style.ViewNavButton} ${view.id === activeView ? style.ViewNavButtonActive : ""}`}
                    onClick={() => onSelectView(view.id)}
                >
                    {view.label}
                </button>
            ))}
        </nav>
    );
}
