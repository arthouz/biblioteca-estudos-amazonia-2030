import { asset } from "../lib/data";

interface Props { theme: "light" | "dark"; onToggleTheme: () => void; onAbout: () => void }

export function Header({ theme, onToggleTheme, onAbout }: Props) {
  return (
    <header className="site-header">
      <div className="wrap site-header-in">
        <a className="wordmark" href="#/" aria-label="Amazônia 2030 · Biblioteca de Estudos">
          <img className="wordmark-logo" src={asset("brand/amazonia2030-logo.png")} width="380" height="159" alt="Amazônia 2030" />
          <span className="wordmark-text"><span>Biblioteca de Estudos</span></span>
        </a>
        <nav className="header-actions" aria-label="Ações da página">
          <button type="button" className="btn-text" onClick={onAbout}>Sobre os dados</button>
          <button type="button" className="btn-icon" onClick={onToggleTheme} aria-pressed={theme === "dark"} aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"} title={theme === "dark" ? "Tema claro" : "Tema escuro"}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              {theme === "dark" ? (<><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></>) : (<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />)}
            </svg>
          </button>
        </nav>
      </div>
    </header>
  );
}
