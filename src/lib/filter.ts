import type { Filters, Library, Publication, SortKey } from "../types";
import { slugText } from "./format";

export const EMPTY_FILTERS: Filters = { category: "todos", year: "", territory: "", institution: "", query: "" };

export const hasActiveFilters = (f: Filters) =>
  f.category !== "todos" || !!f.year || !!f.territory || !!f.institution || !!f.query.trim();

export const inCategory = (p: Publication, id: string) =>
  id === "todos" || p.categories.primary === id || p.categories.secondary.includes(id);

function haystack(p: Publication, lib: Library): string {
  const catLabels = [p.categories.primary, ...p.categories.secondary].map((id) => lib.taxonomy.categories.find((c) => c.id === id)?.label ?? id);
  return slugText([
    p.title, p.subtitle ?? "", p.topic ?? "",
    ...p.authors.flatMap((a) => [a.name, a.affiliation ?? ""]),
    ...p.institutions.map((i) => i.name), ...p.funders,
    ...p.keywords, ...catLabels, p.subcategory ?? "", String(p.year ?? ""), String(p.number ?? ""),
  ].join(" | "));
}

export function applyFilters(lib: Library, f: Filters): Publication[] {
  const phrase = slugText(f.query.trim());
  const terms = phrase.split(/\s+/).filter(Boolean);
  // Frase exata tem prioridade; sem ocorrência, exige todos os termos (em qualquer campo).
  const phraseHit = terms.length > 1 && lib.publications.some((p) => haystack(p, lib).includes(phrase));
  return lib.publications.filter((p) => {
    if (!inCategory(p, f.category)) return false;
    if (f.year && String(p.year ?? "") !== f.year) return false;
    if (f.territory && !p.territories.includes(f.territory)) return false;
    if (f.institution && !p.institutions.some((i) => i.name === f.institution)) return false;
    if (terms.length) { const h = haystack(p, lib); if (phraseHit ? !h.includes(phrase) : !terms.every((t) => h.includes(t))) return false; }
    return true;
  });
}

export function sortPublications(list: Publication[], key: SortKey): Publication[] {
  const c = [...list];
  const byNum = (a: Publication, b: Publication) => (a.number ?? 1e9) - (b.number ?? 1e9);
  if (key === "numero") return c.sort(byNum);
  if (key === "ano") return c.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || byNum(a, b));
  return c.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
}

export interface FacetOption { value: string; count: number }
function count(values: string[][]): FacetOption[] {
  const m = new Map<string, number>();
  values.forEach((vs) => new Set(vs).forEach((v) => m.set(v, (m.get(v) ?? 0) + 1)));
  return [...m.entries()].map(([value, count]) => ({ value, count }));
}
export function facets(lib: Library) {
  const years = count(lib.publications.map((p) => (p.year ? [String(p.year)] : []))).sort((a, b) => Number(b.value) - Number(a.value));
  const territories = count(lib.publications.map((p) => p.territories)).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "pt-BR"));
  const institutions = count(lib.publications.map((p) => p.institutions.map((i) => i.name))).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "pt-BR"));
  const categories = lib.taxonomy.categories
    .map((c) => ({ ...c, count: lib.publications.filter((p) => inCategory(p, c.id)).length }))
    .filter((c) => c.count > 0);
  return { years, territories, institutions, categories };
}

export function yearRange(lib: Library): [number, number] | null {
  const ys = lib.publications.map((p) => p.year).filter((y): y is number => !!y);
  return ys.length ? [Math.min(...ys), Math.max(...ys)] : null;
}
