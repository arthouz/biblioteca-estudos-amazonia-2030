import type { Library, Publication } from "../types";
import { CoverImage } from "./CoverImage";
import { shortAuthors, yearIsPrinted } from "../lib/format";

export function GridView({ lib, items, onOpen }: { lib: Library; items: Publication[]; onOpen: (p: Publication) => void }) {
  const catLabel = (id: string) => lib.taxonomy.categories.find((c) => c.id === id)?.label ?? id;
  return (
    <section className="grid wrap" aria-label="Estudos em grade">
      <ul className="grid-list">
        {items.map((p) => (
          <li key={p.id}>
            <button type="button" className="card" onClick={() => onOpen(p)} aria-label={`Abrir estudo ${p.number ? `nº ${p.number}: ` : ""}${p.title}`}>
              <span className="card-cover"><CoverImage pub={p} /></span>
              <span className="card-body">
                <span className="card-meta">{p.number ? `nº ${p.number}` : "Amazônia 2030"} · {p.year ?? "s.d."}{p.year && !yearIsPrinted(p) ? "*" : ""}</span>
                <span className="card-title">{p.title}</span>
                <span className="card-authors">{shortAuthors(p)}</span>
                <span className="card-cat">{catLabel(p.categories.primary)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
