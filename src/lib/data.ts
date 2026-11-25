import type { Library, Publication, Taxonomy } from "../types";

/** Base relativa: funciona em qualquer subpasta de hospedagem estática. */
const base = new URL(".", document.baseURI).href;
export const asset = (p: string) => new URL(p, base).href;

function arr<T>(v: T[] | undefined | null): T[] { return Array.isArray(v) ? v : []; }

/** Completa campos ausentes para que um novo estudo no JSON não exija mudanças na interface. */
export function normalize(raw: Partial<Publication> & { id: string; title: string }): Publication {
  return {
    id: raw.id,
    number: raw.number ?? null,
    title: raw.title,
    subtitle: raw.subtitle ?? null,
    authors: arr(raw.authors),
    year: raw.year ?? null,
    yearBasis: raw.yearBasis ?? null,
    yearNote: raw.yearNote,
    analysisPeriod: raw.analysisPeriod ?? null,
    institutions: arr(raw.institutions),
    funders: arr(raw.funders),
    series: raw.series ?? null,
    publicationType: raw.publicationType ?? null,
    language: raw.language,
    categories: { primary: raw.categories?.primary ?? "", secondary: arr(raw.categories?.secondary) },
    subcategory: raw.subcategory ?? null,
    territories: arr(raw.territories),
    territoryNote: raw.territoryNote ?? null,
    keywords: arr(raw.keywords),
    keywordsSource: raw.keywordsSource ?? null,
    topic: raw.topic ?? null,
    summary: { synthesis: raw.summary?.synthesis ?? null, official: raw.summary?.official ?? null },
    questions: arr(raw.questions),
    methods: arr(raw.methods),
    findings: arr(raw.findings),
    identifier: { doi: raw.identifier?.doi ?? null, isbn: raw.identifier?.isbn ?? null, url: raw.identifier?.url ?? null, source: raw.identifier?.source ?? "Não identificado" },
    relatedVersions: arr(raw.relatedVersions),
    officialUrl: raw.officialUrl?.trim() || null,
    files: raw.files ?? {},
    cover: raw.cover,
    unidentified: arr(raw.unidentified),
    notes: arr(raw.notes),
  };
}

export async function loadLibrary(): Promise<Library> {
  const [pubRes, taxRes] = await Promise.all([
    fetch(asset("data/publications.json"), { cache: "no-cache" }),
    fetch(asset("data/taxonomy.json"), { cache: "no-cache" }),
  ]);
  if (!pubRes.ok) throw new Error(`publications.json: HTTP ${pubRes.status}`);
  if (!taxRes.ok) throw new Error(`taxonomy.json: HTTP ${taxRes.status}`);
  const pubs = await pubRes.json();
  const taxonomy: Taxonomy = await taxRes.json();
  const seen = new Set<string>();
  const publications = (pubs.publications as Array<Partial<Publication> & { id: string; title: string }>)
    .filter((p) => p && p.id && p.title && !seen.has(p.id) && (seen.add(p.id), true))
    .map(normalize);
  return { collection: pubs.collection ?? { name: "Biblioteca" }, publications, taxonomy };
}
