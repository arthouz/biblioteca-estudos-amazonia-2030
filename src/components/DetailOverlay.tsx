import { useEffect, useRef } from "react";
import type { Library, Publication } from "../types";
import { CoverImage } from "./CoverImage";

interface Props { lib: Library; pub: Publication; onClose: () => void }

/** Resumo curto: primeiras frases da síntese, até ~230 caracteres, sempre terminando em ponto final. */
function brief(text: string | null, max = 230): string | null {
  if (!text) return null;
  const sentences = text.trim().split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý])/);
  let out = "";
  for (const s of sentences) { if (out && (out + " " + s).length > max) break; out = out ? `${out} ${s}` : s; }
  return out;
}

export function DetailOverlay({ lib, pub, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; if (d && !d.open) d.showModal(); }, []);

  const category = lib.taxonomy.categories.find((c) => c.id === pub.categories.primary)?.label;
  const authors = pub.authors.map((a) => a.name).join(", ");
  const summary = brief(pub.summary.synthesis);

  return (
    <dialog ref={ref} className="detail" aria-labelledby="detail-title" onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
      <button type="button" className="detail-close" onClick={() => ref.current?.close()} aria-label="Fechar">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
      <div className="detail-grid">
        <div className="detail-cover"><CoverImage pub={pub} size="large" eager className="detail-cover-img" /></div>
        <article className="detail-body">
          <p className="eyebrow">{[category, pub.year].filter(Boolean).join(" · ")}</p>
          <h2 id="detail-title" className="d-title">{pub.title}</h2>
          {authors && <p className="d-authors">{authors}</p>}
          {summary && <p className="d-text">{summary}</p>}
          {pub.officialUrl
            ? <a className="btn btn-primary btn-lg" href={pub.officialUrl} target="_blank" rel="noopener noreferrer">Ler estudo<span className="visually-hidden"> (abre no site do Amazônia 2030, em nova aba)</span><span aria-hidden="true"> ↗</span></a>
            : <p className="muted small">Link oficial não informado.</p>}
        </article>
      </div>
    </dialog>
  );
}
