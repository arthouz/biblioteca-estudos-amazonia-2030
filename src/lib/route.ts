import { useCallback, useEffect, useState } from "react";
import type { Filters } from "../types";
import { EMPTY_FILTERS } from "./filter";

export interface Route { id: string | null }

export function parseHash(hash: string = location.hash): Route {
  const m = /^#\/estudo\/([^/?#]+)/.exec(hash);
  return { id: m ? decodeURIComponent(m[1]) : null };
}
export const hashFor = (r: Route) => (r.id ? `#/estudo/${encodeURIComponent(r.id)}` : "#/");

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parseHash());
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = useCallback((r: Route) => { const h = hashFor(r); if (location.hash !== h) location.hash = h; else setRoute(r); }, []);
  return [route, go];
}

/** Filtros espelhados na query string (?c=&a=&t=&i=&q=) para links compartilháveis. */
export function filtersFromUrl(): Filters {
  const q = new URLSearchParams(location.search);
  return { category: q.get("c") || "todos", year: q.get("a") || "", territory: q.get("t") || "", institution: q.get("i") || "", query: q.get("q") || "" };
}
export function filtersToUrl(f: Filters) {
  const q = new URLSearchParams();
  if (f.category !== EMPTY_FILTERS.category) q.set("c", f.category);
  if (f.year) q.set("a", f.year);
  if (f.territory) q.set("t", f.territory);
  if (f.institution) q.set("i", f.institution);
  if (f.query.trim()) q.set("q", f.query.trim());
  const s = q.toString();
  const url = location.pathname + (s ? `?${s}` : "") + location.hash;
  history.replaceState(null, "", url);
}
