import style from "./AppHeader.module.scss";
import useTheme from "../../../hooks/useTheme.ts";

export default function AppHeader() {
    const {theme, toggleTheme} = useTheme();

    return (
        <header className={style.AppHeader}>
            <h1 className={style.Title}>Eitz Harmonium</h1>
            <button
                type="button"
                className={style.ThemeToggle}
                onClick={toggleTheme}
                aria-label="Toggle color theme"
            >
                {theme === "dark" ? "☀ Light" : "☾ Dark"}
            </button>
        </header>
    );
}
