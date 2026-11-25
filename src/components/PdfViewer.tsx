import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { Publication } from "../types";
import { asset } from "../lib/data";

type PdfDoc = { numPages: number; getPage(n: number): Promise<PdfPage> };
type PdfTask = { promise: Promise<unknown>; destroy(): Promise<void>; onProgress?: (p: { loaded: number; total: number }) => void };
type PdfPage = { getViewport(o: { scale: number }): { width: number; height: number }; render(o: { canvasContext: CanvasRenderingContext2D; viewport: unknown; canvas: HTMLCanvasElement }): { promise: Promise<void>; cancel(): void } };

export function PdfViewer({ pub, onClose }: { pub: Publication; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const doc = useRef<PdfDoc | null>(null);
  const taskRef = useRef<PdfTask | null>(null);
  const fitScale = useRef(1);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState(pub.files.pages ?? 0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState<"fit" | number>("fit");
  const [rendering, setRendering] = useState(false);
  const url = pub.files.pdf ? asset(pub.files.pdf) : "";

  useEffect(() => { root.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus(); }, []);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/build/pdf.min.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = asset("pdfjs/pdf.worker.min.mjs");
        const task = pdfjs.getDocument({
          url, cMapUrl: asset("pdfjs/cmaps/"), cMapPacked: true, standardFontDataUrl: asset("pdfjs/standard_fonts/"),
          wasmUrl: asset("pdfjs/wasm/"), iccUrl: asset("pdfjs/iccs/"),
        });
        taskRef.current = task as unknown as PdfTask;
        task.onProgress = (p: { loaded: number; total: number }) => { if (p.total) setProgress(Math.min(1, p.loaded / p.total)); };
        const d = (await task.promise) as unknown as PdfDoc;
        if (dead) { void task.destroy(); return; }
        doc.current = d; setPages(d.numPages); setState("ready");
      } catch { if (!dead) setState("error"); }
    })();
    return () => { dead = true; void taskRef.current?.destroy(); taskRef.current = null; doc.current = null; };
  }, [url]);

  const draw = useCallback(async () => {
    const d = doc.current, c = canvas.current, s = stage.current; if (!d || !c || !s) return;
    setRendering(true);
    try {
      const pg = await d.getPage(page);
      const base = pg.getViewport({ scale: 1 });
      const fit = Math.max(0.3, Math.min(s.clientWidth - 32, 1000) / base.width);
      fitScale.current = fit;
      const scale = (zoom === "fit" ? fit : zoom) * 1;
      const vp = pg.getViewport({ scale: scale * (window.devicePixelRatio || 1) });
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      c.style.width = `${Math.floor(vp.width / (window.devicePixelRatio || 1))}px`;
      c.style.height = `${Math.floor(vp.height / (window.devicePixelRatio || 1))}px`;
      const ctx = c.getContext("2d"); if (!ctx) return;
      await pg.render({ canvasContext: ctx, viewport: vp, canvas: c }).promise;
    } catch { /* render cancelado por troca rápida de página */ }
    setRendering(false);
  }, [page, zoom]);

  useEffect(() => { if (state === "ready") void draw(); }, [state, draw]);
  useEffect(() => {
    if (state !== "ready") return;
    const on = () => void draw(); window.addEventListener("resize", on); return () => window.removeEventListener("resize", on);
  }, [state, draw]);

  const go = (n: number) => { const v = Math.max(1, Math.min(pages || 1, n)); setPage(v); stage.current?.scrollTo({ top: 0 }); };
  const onKey = (e: ReactKeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(); return; }
    if (e.key === "Tab") { // mantém o foco dentro do leitor
      const f = [...(root.current?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], input:not(:disabled)") ?? [])];
      if (f.length) { const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
      return;
    }
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(page + 1); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(page - 1); }
  };
  const z = (f: number) => setZoom((cur) => { const base = cur === "fit" ? fitScale.current : cur; return Math.max(0.4, Math.min(5, +(base * f).toFixed(3))); });

  return (
    <div ref={root} className="reader" role="dialog" aria-modal="true" aria-label={`Leitor de PDF: ${pub.title}`} onKeyDown={onKey}>
      <header className="reader-bar">
        <div className="reader-title"><strong>{pub.title}</strong><span className="muted small">{pages ? `${pages} páginas` : ""}</span></div>
        <div className="reader-tools">
          <div className="reader-group" role="group" aria-label="Páginas">
            <button type="button" onClick={() => go(page - 1)} disabled={page <= 1 || state !== "ready"} aria-label="Página anterior">‹</button>
            <label className="reader-page"><span className="visually-hidden">Página</span>
              <input type="number" min={1} max={pages || 1} value={page} disabled={state !== "ready"} onChange={(e) => go(Number(e.target.value) || 1)} />
              <span aria-hidden="true">/ {pages || "–"}</span></label>
            <button type="button" onClick={() => go(page + 1)} disabled={state !== "ready" || page >= pages} aria-label="Próxima página">›</button>
          </div>
          <div className="reader-group" role="group" aria-label="Zoom">
            <button type="button" onClick={() => z(1 / 1.2)} disabled={state !== "ready"} aria-label="Diminuir zoom">−</button>
            <button type="button" onClick={() => setZoom("fit")} disabled={state !== "ready"} className="reader-fit">Ajustar</button>
            <button type="button" onClick={() => z(1.2)} disabled={state !== "ready"} aria-label="Aumentar zoom">+</button>
          </div>
          {pub.officialUrl
            ? <a className="btn btn-sm" href={pub.officialUrl} target="_blank" rel="noopener noreferrer">Baixar no site do Amazônia 2030 ↗</a>
            : <a className="btn btn-sm" href={url} download={pub.files.source ?? `${pub.id}.pdf`}>Baixar</a>}
          <button type="button" className="btn btn-sm" data-autofocus onClick={onClose}>Fechar leitor</button>
        </div>
      </header>
      <div className="reader-stage" ref={stage}>
        {state === "loading" && (
          <div className="reader-state" role="status"><p>Carregando o documento…</p>
            <div className="bar"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>
            <p className="muted small">{progress ? `${Math.round(progress * 100)}%` : "Conectando"}{pub.files.bytes && pub.files.bytes > 20e6 ? " · documento grande" : ""}</p></div>
        )}
        {state === "error" && (
          <div className="reader-state" role="alert"><p><strong>Não foi possível abrir o PDF aqui.</strong></p>
            <p className="muted">Você ainda pode abrir o arquivo diretamente no navegador ou baixá-lo.</p>
            <p><a className="btn btn-primary" href={url} target="_blank" rel="noopener noreferrer">Abrir PDF em nova aba</a>{" "}{pub.officialUrl
              ? <a className="btn" href={pub.officialUrl} target="_blank" rel="noopener noreferrer">Baixar no site do Amazônia 2030 ↗</a>
              : <a className="btn" href={url} download={pub.files.source ?? `${pub.id}.pdf`}>Baixar PDF</a>}</p></div>
        )}
        <canvas ref={canvas} className={`reader-canvas ${state === "ready" ? "" : "hidden"} ${rendering ? "is-rendering" : ""}`} aria-label={`Página ${page} de ${pages}`} />
      </div>
    </div>
  );
}
