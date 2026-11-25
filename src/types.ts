export type YearBasis = "impresso" | "fonte-secundaria" | "inferido";

export interface Author { name: string; affiliation: string | null }
export interface Institution { name: string; role: string }
export interface Identifier { doi: string | null; isbn: string | null; url: string | null; source: string }
export interface RelatedVersion { title: string; kind: string; reference: string }
export interface OfficialExcerpt { text: string; page: string }

export interface PublicationFiles {
  pdf?: string; source?: string; bytes?: number; pages?: number; sha256?: string; pageSizePt?: [number, number];
}
export interface PublicationCover {
  large: string; thumb: string; width: number; height: number; source: string; alt: string; spineColor: string; spineText: string;
}

export interface Publication {
  id: string;
  number: number | null;
  title: string;
  subtitle: string | null;
  authors: Author[];
  year: number | null;
  yearBasis: YearBasis | null;
  yearNote?: string;
  analysisPeriod?: string | null;
  institutions: Institution[];
  funders: string[];
  series: string | null;
  publicationType?: string | null;
  language?: string;
  categories: { primary: string; secondary: string[] };
  subcategory?: string | null;
  territories: string[];
  territoryNote?: string | null;
  keywords: string[];
  keywordsSource: "oficial" | "aplicacao" | null;
  topic?: string | null;
  summary: { synthesis: string | null; official: OfficialExcerpt | null };
  questions: string[];
  methods: string[];
  findings: string[];
  identifier: Identifier;
  relatedVersions: RelatedVersion[];
  /** Página/arquivo oficial no site do Amazônia 2030. Se preenchido, o botão de download redireciona para ele (contagem de downloads no site). */
  officialUrl: string | null;
  files: PublicationFiles;
  cover?: PublicationCover;
  unidentified: string[];
  notes: string[];
}

export interface Category { id: string; label: string; description?: string }
export interface Taxonomy { version: number; note?: string; categories: Category[] }
export interface Collection { name: string; note?: string }
export interface Library { collection: Collection; publications: Publication[]; taxonomy: Taxonomy }

export interface Filters { category: string; year: string; territory: string; institution: string; query: string }
export type SortKey = "numero" | "ano" | "titulo";
export type ViewMode = "estante" | "grade";
