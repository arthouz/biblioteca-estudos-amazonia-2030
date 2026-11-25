import { useCallback, useEffect, useMemo, useState } from "react";
import type { Filters, Library, Publication, SortKey, ViewMode } from "./types";
import { loadLibrary } from "./lib/data";
import { EMPTY_FILTERS, applyFilters, facets, hasActiveFilters, sortPublications } from "./lib/filter";
import { filtersFromUrl, filtersToUrl, useRoute } from "./lib/route";
import { useMedia } from "./lib/useMedia";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { FilterBar } from "./components/FilterBar";
import { Shelf3D } from "./components/Shelf3D";
import { GridView } from "./components/GridView";
import { DetailOverlay } from "./components/DetailOverlay";
import { AboutDialog } from "./components/AboutDialog";
import { EmptyState, ErrorState, LoadingState } from "./components/States";

type Theme = "light" | "dark";
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* armazenamento indisponível */ } },
};

export default function App() {
  const [lib, setLib] = useState<Library | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(() => filtersFromUrl());
  const [sort, setSort] = useState<SortKey>("numero");
  const narrow = useMedia("(max-width: 719px)");
  const [view, setView] = useState<ViewMode | null>(() => (store.get("a2030-view") as ViewMode | null));
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.getAttribute("data-theme") as Theme | null) ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  const [about, setAbout] = useState(false);
  const [route, go] = useRoute();

  const load = useCallback(() => { setError(null); setLib(null); loadLibrary().then(setLib).catch((e) => setError(String(e?.message ?? e))); }, []);
  useEffect(load, [load]);
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  useEffect(() => { filtersToUrl(filters); }, [filters]);

  const effectiveView: ViewMode = view ?? (narrow ? "grade" : "estante");
  const fac = useMemo(() => (lib ? facets(lib) : null), [lib]);
  const items = useMemo(() => (lib ? sortPublications(applyFilters(lib, filters), sort) : []), [lib, filters, sort]);
  const active = hasActiveFilters(filters);
  const clear = () => setFilters(EMPTY_FILTERS);

  const open = (p: Publication) => go({ id: p.id, reader: false });
  const current = lib && route.id ? lib.publications.find((p) => p.id === route.id) ?? null : null;
  const order = items.some((p) => p.id === current?.id) ? items : lib?.publications ?? [];
  const idx = current ? order.findIndex((p) => p.id === current.id) : -1;

  useEffect(() => { if (lib && route.id && !current) go({ id: null, reader: false }); }, [lib, route.id, current, go]);
  useEffect(() => { document.title = current ? `${current.title} · Amazônia 2030` : "Biblioteca de Estudos · Amazônia 2030"; }, [current]);

  return (
    <>
      <a className="skip" href="#conteudo">Ir para o conteúdo</a>
      <Header theme={theme} onToggleTheme={() => { const t = theme === "dark" ? "light" : "dark"; setTheme(t); store.set("a2030-theme", t); }} onAbout={() => setAbout(true)} />
      <main id="conteudo">
        {error && <ErrorState message={error} onRetry={load} />}
        {!error && !lib && <LoadingState />}
        {lib && fac && (
          <>
            <Hero lib={lib} />
            <FilterBar filters={filters} onChange={setFilters} onClear={clear} active={active} total={lib.publications.length} shown={items.length}
              categories={fac.categories} years={fac.years} territories={fac.territories} institutions={fac.institutions}
              sort={sort} onSort={setSort} view={effectiveView} onView={(v) => { setView(v); store.set("a2030-view", v); }} />
            {items.length === 0 ? <EmptyState onClear={clear} /> : effectiveView === "estante" ? <Shelf3D lib={lib} items={items} onOpen={open} /> : <GridView lib={lib} items={items} onOpen={open} />}
          </>
        )}
      </main>
      <footer className="site-footer wrap">
        <p>Biblioteca digital dos estudos do Amazônia 2030. Os PDFs e seus conteúdos pertencem aos respectivos autores e instituições.</p>
        <p className="muted small">* Ano não impresso no PDF. Veja “Sobre os dados”.</p>
      </footer>
      {about && <AboutDialog onClose={() => setAbout(false)} />}
      {lib && current && (
        <DetailOverlay key={current.id} lib={lib} pub={current} prev={idx > 0 ? order[idx - 1] : null} next={idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null}
          readerOpen={route.reader} onClose={() => go({ id: null, reader: false })} onReader={() => go({ id: current.id, reader: true })} onCloseReader={() => go({ id: current.id, reader: false })} onNavigate={open} />
      )}
    </>
  );
}
