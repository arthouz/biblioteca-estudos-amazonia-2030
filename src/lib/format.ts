import type { Publication, YearBasis } from "../types";

export const NAO_IDENTIFICADO = "Não identificado";

function surname(full: string): string {
  const parts = full.trim().split(/\s+/).filter((t) => !/^[A-Z]\.$/.test(t));
  return parts[parts.length - 1] ?? full;
}

/** Sobrenomes para exibição curta (a ficha completa mantém os nomes como impressos). */
export function shortAuthors(p: Publication, max = 3): string {
  const names = p.authors.map((a) => surname(a.name));
  if (names.length === 0) return NAO_IDENTIFICADO;
  if (names.length === 1) return names[0];
  if (names.length > max) return `${names[0]} et al.`;
  return names.slice(0, -1).join(", ") + " e " + names[names.length - 1];
}
export function spineAuthor(p: Publication): string {
  const names = p.authors.map((a) => surname(a.name));
  if (names.length === 0) return NAO_IDENTIFICADO;
  return names.length > 1 ? `${names[0]} et al.` : names[0];
}

export const YEAR_BASIS_LABEL: Record<YearBasis, string> = {
  impresso: "Ano impresso no documento",
  "fonte-secundaria": "Ano conforme a lista de estudos AMZ2030 (Fatos da Amazônia 2026); não impresso no PDF",
  inferido: "Ano inferido a partir do conteúdo; não impresso no PDF",
};
export const yearIsPrinted = (p: Publication) => p.yearBasis === "impresso";

export function formatBytes(n?: number): string {
  if (!n) return NAO_IDENTIFICADO;
  return n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(".", ",")} MB` : `${Math.round(n / 1e3)} KB`;
}

export function slugText(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function titleSizeClass(title: string): "t1" | "t2" | "t3" | "t4" {
  const n = title.length;
  return n <= 28 ? "t1" : n <= 52 ? "t2" : n <= 80 ? "t3" : "t4";
}

export const spineThickness = (pages?: number) => Math.round(Math.min(112, Math.max(72, 62 + (pages ?? 30) * 0.62)));
