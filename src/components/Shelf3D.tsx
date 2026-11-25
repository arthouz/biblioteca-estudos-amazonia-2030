import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import type { Library, Publication } from "../types";
import { asset } from "../lib/data";
import { shortAuthors, spineAuthor, spineThickness, titleSizeClass, yearIsPrinted } from "../lib/format";

interface Props { lib: Library; items: Publication[]; onOpen: (p: Publication) => void }

export function Shelf3D({ lib, items, onOpen }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [pulled, setPulled] = useState<string | null>(null);
  const [hiRes, setHiRes] = useState<Set<string>>(() => new Set());
  const [edges, setEdges] = useState({ start: true, end: true });

  const updateOrigin = useCallback(() => {
    const s = scroller.current, t = track.current; if (!s || !t) return;
    const x = s.scrollLeft + s.clientWidth / 2 - t.offsetLeft;
    t.style.setProperty("--px", `${x}px`);
    setEdges({ start: s.scrollLeft <= 4, end: s.scrollLeft + s.clientWidth >= s.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    updateOrigin();
    const s = scroller.current; if (!s) return;
    s.addEventListener("scroll", updateOrigin, { passive: true });
    window.addEventListener("resize", updateOrigin);
    return () => { s.removeEventListener("scroll", updateOrigin); window.removeEventListener("resize", updateOrigin); };
  }, [updateOrigin, items.length]);

  const page = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * Math.max(240, scroller.current.clientWidth * 0.7), behavior: "smooth" });

  const onKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const btns = [...(track.current?.querySelectorAll<HTMLButtonElement>(".book-hit") ?? [])];
    const i = btns.indexOf(document.activeElement as HTMLButtonElement); if (i < 0) return;
    let n = i;
    if (e.key === "ArrowRight") n = Math.min(btns.length - 1, i + 1);
    else if (e.key === "ArrowLeft") n = Math.max(0, i - 1);
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = btns.length - 1;
    else return;
    e.preventDefault(); btns[n].focus();
    btns[n].scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const c = cursor.current; if (!c || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    c.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
  };
  const setLabel = (txt: string) => { const el = cursor.current?.firstElementChild; if (el && el.textContent !== txt) el.textContent = txt; };
  const overBook = (e: PointerEvent<HTMLElement>) => { if (e.pointerType === "mouse") { setLabel("Ver capa"); cursor.current?.classList.add("on"); } };
  const outBook = () => cursor.current?.classList.remove("on");

  const pulledId = items.some((p) => p.id === pulled) ? pulled : null;

  // Recolhe a capa ao clicar fora do livro ou com Esc (sem interferir na ficha aberta).
  useEffect(() => {
    if (!pulledId) return;
    const down = (e: globalThis.PointerEvent) => { const t = e.target; if (t instanceof Element && !t.closest(".book.is-pulled")) setPulled(null); };
    const key = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape" && !document.querySelector("dialog[open]")) setPulled(null); };
    document.addEventListener("pointerdown", down); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [pulledId]);

  const togglePull = (p: Publication, btn: HTMLButtonElement) => {
    const next = pulledId === p.id ? null : p.id;
    setPulled(next);
    if (next) btn.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  };

  // Inclinação sutil da capa acompanhando o ponteiro.
  const tilt = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    const li = e.currentTarget.closest<HTMLElement>(".book"); if (!li) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
    li.style.setProperty("--ry", `${(nx * 12).toFixed(2)}deg`);
    li.style.setProperty("--rx", `${(-ny * 9).toFixed(2)}deg`);
  };
  const tiltStart = (e: PointerEvent<HTMLButtonElement>) => { e.currentTarget.closest(".book")?.classList.add("tilting"); if (e.pointerType === "mouse") { setLabel("Abrir"); cursor.current?.classList.add("on"); } };
  const tiltEnd = (e: PointerEvent<HTMLButtonElement>) => {
    const li = e.currentTarget.closest<HTMLElement>(".book"); li?.classList.remove("tilting");
    li?.style.removeProperty("--ry"); li?.style.removeProperty("--rx");
    if (e.pointerType === "mouse") setLabel("Ver capa");
  };

  // Carrega a capa em alta resolução só quando o livro é focado pela primeira vez.
  useEffect(() => {
    if (pulledId && !hiRes.has(pulledId)) setHiRes((prev) => new Set(prev).add(pulledId));
  }, [pulledId, hiRes]);

  const active = items.find((p) => p.id === (focused ?? pulledId)) ?? null;
  const catLabel = (id: string) => lib.taxonomy.categories.find((c) => c.id === id)?.label ?? id;

  return (
    <section className="shelf wrap" aria-label="Estante de estudos">
      <div className="shelf-stage" onPointerMove={onMove}>
        <button type="button" className="shelf-nav prev" onClick={() => page(-1)} disabled={edges.start} aria-label="Ver estudos anteriores">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5-7 7 7 7" /></svg>
        </button>
        <div className="shelf-scroller" ref={scroller}>
          <ul className="shelf-track" ref={track} onKeyDown={onKey}>
            {items.map((p) => {
              const T = spineThickness(p.files.pages);
              const ratio = p.cover ? p.cover.width / p.cover.height : 0.707;
              const style = {
                "--t": `${T}px`, "--ratio": ratio,
                "--spine": p.cover?.spineColor ?? "#3a4a40", "--spine-ink": p.cover?.spineText ?? "#fff",
              } as CSSProperties;
              return (
                <li key={p.id} className={`book ${focused === p.id ? "is-active" : ""} ${pulledId === p.id ? "is-pulled" : ""}`} style={style}
                  onPointerEnter={overBook} onPointerLeave={outBook}>
                  <div className="book-3d" aria-hidden="true">
                    <div className="face spine">
                      <span className="spine-band"><b>{p.number ?? "–"}</b></span>
                      <span className="spine-text">
                        <span className={`spine-title ${titleSizeClass(p.title)}`}>{p.title}</span>
                        <span className="spine-author">{spineAuthor(p)}</span>
                      </span>
                      <span className="spine-year">{p.year ?? "–"}{p.year && !yearIsPrinted(p) ? "*" : ""}</span>
                    </div>
                    <div className="face front">
                      {p.cover ? (
                        <>
                          <img src={asset(p.cover.thumb)} alt="" draggable={false} loading="lazy" decoding="async" />
                          {hiRes.has(p.id) && <img className="hi" src={asset(p.cover.large)} alt="" draggable={false} decoding="async" onLoad={(e) => e.currentTarget.classList.add("ready")} />}
                        </>
                      ) : <div className="cover-fallback"><span>{p.title}</span></div>}
                    </div>
                    <div className="face back" />
                  </div>
                  <button type="button" className="book-hit" onClick={(e) => togglePull(p, e.currentTarget)} onFocus={() => setFocused(p.id)} onBlur={() => setFocused((f) => (f === p.id ? null : f))}
                    onPointerEnter={() => setFocused(p.id)} aria-expanded={pulledId === p.id}
                    aria-label={`Ver capa do estudo ${p.number ? `nº ${p.number}: ` : ""}${p.title}, ${shortAuthors(p)}${p.year ? `, ${p.year}` : ""}`} />
                  {pulledId === p.id && (
                    <button type="button" className="cover-hit" onClick={() => onOpen(p)}
                      onPointerEnter={tiltStart} onPointerMove={tilt} onPointerLeave={tiltEnd}
                      aria-label={`Abrir estudo ${p.number ? `nº ${p.number}: ` : ""}${p.title}`} />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <button type="button" className="shelf-nav next" onClick={() => page(1)} disabled={edges.end} aria-label="Ver próximos estudos">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7" /></svg>
        </button>
        <div className="open-cursor" ref={cursor} aria-hidden="true"><span>Ver capa</span></div>
      </div>
      <div className="shelf-board" aria-hidden="true" />
      <div className="shelf-caption" aria-live="off">
        {active ? (
          <>
            <p className="caption-meta">{active.number ? `Amazônia 2030 · nº ${active.number}` : "Amazônia 2030"} · {active.year ?? "ano não identificado"}{active.year && !yearIsPrinted(active) ? "*" : ""} · {catLabel(active.categories.primary)}</p>
            <p className="caption-title">{active.title}</p>
            <p className="caption-authors">{shortAuthors(active)}</p>
          </>
        ) : (
          <p className="caption-hint">Clique num livro (ou use as setas e Enter) para ver a capa; clique na capa para abrir o estudo.</p>
        )}
      </div>
    </section>
  );
}
