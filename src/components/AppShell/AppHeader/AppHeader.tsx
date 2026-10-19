import style from "./AppHeader.module.scss";
import useTheme from "../../../hooks/useTheme.ts";
import {useI18n} from "../../../i18n.tsx";

export default function AppHeader() {
    const {theme, toggleTheme} = useTheme();
    const {language, setLanguage, t} = useI18n();

    return (
        <header className={style.AppHeader}>
            <h1 className={style.Title}>{t("app.title")}</h1>
            <div className={style.Actions}>
                <label className={style.LanguageSelector}>
                    {t("language.label")}
                    <select
                        value={language}
                        onChange={event => setLanguage(event.target.value === "de" ? "de" : "en")}
                        aria-label={t("language.label")}
                    >
                        <option value="en">{t("language.english")}</option>
                        <option value="de">{t("language.german")}</option>
                    </select>
                </label>
                <button
                    type="button"
                    className={style.ThemeToggle}
                    onClick={toggleTheme}
                    aria-label={t("theme.toggle")}
                >
                    {theme === "dark" ? t("theme.light") : t("theme.dark")}
                </button>
            </div>
        </header>
    );
}
