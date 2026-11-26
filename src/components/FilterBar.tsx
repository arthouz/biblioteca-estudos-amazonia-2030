import { useLayoutEffect, useRef, useState } from "react";
import type { Filters, SortKey, ViewMode } from "../types";
import type { FacetOption } from "../lib/filter";
import type { Category } from "../types";

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClear: () => void;
  active: boolean;
  total: number;
  shown: number;
  categories: Array<Category & { count: number }>;
  years: FacetOption[];
  territories: FacetOption[];
  institutions: FacetOption[];
  sort: SortKey;
  onSort: (s: SortKey) => void;
  view: ViewMode;
  onView: (v: ViewMode) => void;
}

export function FilterBar(p: Props) {
  const { filters, onChange } = p;
  const groupRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const place = () => {
      const g = groupRef.current; if (!g) return;
      const el = g.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (el) setInd({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
    };
    place();
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [filters.category, p.categories.length]);

  const [panel, setPanel] = useState(() => Boolean(filters.year || filters.territory || filters.institution));
  const extra = [filters.year, filters.territory, filters.institution].filter(Boolean).length + (p.sort !== "numero" ? 1 : 0);
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  return (
    <section className="filters wrap" aria-labelledby="page-title">
      <div className="filters-bar">
        <h1 id="page-title">Biblioteca de estudos</h1>
        <div className="spacer" />
        <label className="field-search">
          <span className="visually-hidden">Buscar</span>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
          <input type="search" value={filters.query} placeholder="Buscar" onChange={(e) => set({ query: e.target.value })} autoComplete="off" aria-label="Buscar" />
        </label>
        <button type="button" className="filters-toggle" aria-expanded={panel} aria-controls="filters-panel" onClick={() => setPanel((v) => !v)}>
          Filtros{extra > 0 && <span className="filters-badge" aria-label={`${extra} ativos`}>{extra}</span>}
        </button>
        <div className="view-toggle" role="group" aria-label="Modo de visualização">
          <button type="button" aria-pressed={p.view === "estante"} onClick={() => p.onView("estante")}>Estante</button>
          <button type="button" aria-pressed={p.view === "grade"} onClick={() => p.onView("grade")}>Grade</button>
        </div>
      </div>

      <div className="filters-top">
        <div className="pills-wrap">
          <div className="pills" ref={groupRef} role="group" aria-label="Categorias temáticas">
            {ind && <span className="pill-indicator" aria-hidden="true" style={{ transform: `translate(${ind.x}px, ${ind.y}px)`, width: ind.w, height: ind.h }} />}
            <button type="button" className="pill" aria-pressed={filters.category === "todos"} onClick={() => set({ category: "todos" })}>
              Todos
            </button>
            {p.categories.map((c) => (
              <button type="button" key={c.id} className="pill" aria-pressed={filters.category === c.id} title={c.description} onClick={() => set({ category: c.id })}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div id="filters-panel" className="filters-panel" hidden={!panel}>
        <label className="field">
          <span className="field-label">Ano</span>
          <select value={filters.year} onChange={(e) => set({ year: e.target.value })}>
            <option value="">Todos</option>
            {p.years.map((y) => <option key={y.value} value={y.value}>{y.value} ({y.count})</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Território</span>
          <select value={filters.territory} onChange={(e) => set({ territory: e.target.value })}>
            <option value="">Todos</option>
            {p.territories.map((t) => <option key={t.value} value={t.value}>{t.value} ({t.count})</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Instituição</span>
          <select value={filters.institution} onChange={(e) => set({ institution: e.target.value })}>
            <option value="">Todas</option>
            {p.institutions.map((i) => <option key={i.value} value={i.value}>{i.value} ({i.count})</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Ordenar</span>
          <select value={p.sort} onChange={(e) => p.onSort(e.target.value as SortKey)}>
            <option value="numero">Número da série</option>
            <option value="ano">Ano (mais recente)</option>
            <option value="titulo">Título (A–Z)</option>
          </select>
        </label>
      </div>

      <div className="filters-status">
        <p role="status" aria-live="polite" className={`result-count ${p.shown === p.total && !p.active ? "visually-hidden" : ""}`}>
          {p.shown === p.total ? `${p.total} ${p.total === 1 ? "estudo" : "estudos"}` : `${p.shown} de ${p.total} estudos`}
        </p>
        {p.active && <button type="button" className="btn-text" onClick={p.onClear}>Limpar filtros</button>}
      </div>
    </section>
  );
}
