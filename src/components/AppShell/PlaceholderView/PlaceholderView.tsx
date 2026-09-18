import style from "./PlaceholderView.module.scss";

type PlaceholderViewProps = {
    title: string;
};

// Shared "not built yet" placeholder for views covered by later plan phases.
export default function PlaceholderView({title}: PlaceholderViewProps) {
    return (
        <div className={style.PlaceholderView}>
            <h2>{title}</h2>
            <p>This view is coming in a future phase.</p>
        </div>
    );
}
