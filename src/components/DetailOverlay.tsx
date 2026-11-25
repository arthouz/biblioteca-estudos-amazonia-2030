import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Library, Publication } from "../types";
import { CoverImage } from "./CoverImage";
import { PdfViewer } from "./PdfViewer";
import { Unidentified } from "./States";
import { asset } from "../lib/data";
import { NAO_IDENTIFICADO, YEAR_BASIS_LABEL, formatBytes, yearIsPrinted } from "../lib/format";

type PdfStatus = "checking" | "ok" | "missing";

async function checkPdf(url: string, signal: AbortSignal): Promise<boolean> {
  try {
    let r = await fetch(url, { method: "HEAD", signal });
    if (r.status === 405 || r.status === 501) r = await fetch(url, { headers: { Range: "bytes=0-0" }, signal });
    return r.ok;
  } catch { return false; }
}

function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return <section className="d-section" aria-labelledby={id}><h3 id={id}>{title}</h3>{children}</section>;
}
const List = ({ items }: { items: string[] }) => <ul className="d-list">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>;

interface Props {
  lib: Library; pub: Publication; prev: Publication | null; next: Publication | null;
  readerOpen: boolean; onClose: () => void; onReader: () => void; onCloseReader: () => void; onNavigate: (p: Publication) => void;
}

export function DetailOverlay({ lib, pub, prev, next, readerOpen, onClose, onReader, onCloseReader, onNavigate }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const readBtn = useRef<HTMLButtonElement>(null);
  const wasReader = useRef(false);
  useEffect(() => { if (wasReader.current && !readerOpen) readBtn.current?.focus(); wasReader.current = readerOpen; }, [readerOpen]);
  const [pdf, setPdf] = useState<PdfStatus>("checking");
  const pdfUrl = pub.files.pdf ? asset(pub.files.pdf) : null;

  useEffect(() => { const d = ref.current; if (d && !d.open) d.showModal(); }, []);
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }); }, [pub.id]);
  useEffect(() => {
    if (!pdfUrl) { setPdf("missing"); return; }
    setPdf("checking");
    const ac = new AbortController();
    checkPdf(pdfUrl, ac.signal).then((ok) => { if (!ac.signal.aborted) setPdf(ok ? "ok" : "missing"); });
    return () => ac.abort();
  }, [pdfUrl]);

  const catLabel = (id: string) => lib.taxonomy.categories.find((c) => c.id === id)?.label ?? id;
  const cats = [pub.categories.primary, ...pub.categories.secondary].filter(Boolean);
  const inst = (role: RegExp) => pub.institutions.filter((i) => role.test(i.role));
  const publishers = inst(/publica|realiza|parceir/i), affiliations = inst(/afilia/i);
  const link = pub.identifier.doi ? `https://doi.org/${pub.identifier.doi}` : pub.identifier.url;

  return (
    <dialog ref={ref} className="detail" aria-labelledby="detail-title" onClose={onClose}
      onKeyDown={(e) => { if (e.key === "ArrowLeft" && e.altKey && prev) onNavigate(prev); if (e.key === "ArrowRight" && e.altKey && next) onNavigate(next); }}>
      <div className="detail-grid" inert={readerOpen}>
        <aside className="detail-cover">
          <button type="button" className="detail-close" onClick={() => ref.current?.close()} aria-label="Fechar e voltar à biblioteca">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            <span>Fechar</span>
          </button>
          <div className="detail-cover-inner"><CoverImage pub={pub} size="large" eager className="detail-cover-img" /></div>
        </aside>

        <div className="detail-body" ref={bodyRef}>
          <article>
            <p className="eyebrow">{pub.series ?? "Amazônia 2030"}</p>
            <h2 id="detail-title" className="d-title">{pub.title}</h2>
            {pub.subtitle && <p className="d-subtitle">{pub.subtitle}</p>}
            <ul className="d-cats" aria-label="Categorias">{cats.map((c, i) => <li key={c} className={i === 0 ? "primary" : ""}>{catLabel(c)}</li>)}</ul>

            <div className="d-actions">
              {pdf === "ok" && pdfUrl && (<>
                <button type="button" className="btn btn-primary" ref={readBtn} onClick={onReader}>Ler PDF</button>
                {pub.officialUrl
                  ? <a className="btn" href={pub.officialUrl} target="_blank" rel="noopener noreferrer">Baixar no site do Amazônia 2030<span className="visually-hidden"> (abre em nova aba)</span> ↗</a>
                  : <a className="btn" href={pdfUrl} download={pub.files.source ?? `${pub.id}.pdf`}>Baixar PDF{pub.files.bytes ? ` · ${formatBytes(pub.files.bytes)}` : ""}</a>}
              </>)}
              {pdf === "checking" && <span className="muted small" role="status">Verificando o documento…</span>}
              {pdf === "missing" && <p className="notice" role="alert"><strong>Documento indisponível.</strong> O arquivo PDF deste estudo não foi encontrado no servidor. As informações da ficha continuam disponíveis.</p>}
              {link && <a className="btn" href={link} target="_blank" rel="noopener noreferrer">{pub.identifier.doi ? "Abrir DOI" : "Abrir link externo"}<span className="visually-hidden"> (abre em nova aba)</span> ↗</a>}
            </div>

            <dl className="d-facts">
              <div><dt>Autores</dt><dd>{pub.authors.length ? (
                <ul className="d-authors">{pub.authors.map((a) => <li key={a.name}><span>{a.name}</span>{a.affiliation ? <small>{a.affiliation}</small> : <small className="muted">Afiliação: não identificada neste PDF</small>}</li>)}</ul>
              ) : <Unidentified />}</dd></div>
              <div><dt>Ano</dt><dd>{pub.year ? <>{pub.year}{!yearIsPrinted(pub) && "*"}</> : <Unidentified />}
                {pub.yearBasis && <small className="d-note">{pub.yearNote ?? YEAR_BASIS_LABEL[pub.yearBasis]}</small>}</dd></div>
              <div><dt>Período analisado</dt><dd>{pub.analysisPeriod && pub.analysisPeriod !== NAO_IDENTIFICADO ? pub.analysisPeriod : <Unidentified />}</dd></div>
              <div><dt>Instituições</dt><dd>{publishers.length ? publishers.map((i) => i.name).join(" · ") : <Unidentified />}{affiliations.length > 0 && <small className="d-note">Afiliação dos autores: {affiliations.map((i) => i.name).join("; ")}</small>}</dd></div>
              <div><dt>Apoio</dt><dd>{pub.funders.length ? pub.funders.join(" · ") : <Unidentified />}</dd></div>
              <div><dt>Território</dt><dd>{pub.territories.length ? pub.territories.join(" · ") : <Unidentified />}{pub.territoryNote && <small className="d-note">{pub.territoryNote}</small>}</dd></div>
              <div><dt>Tipo e série</dt><dd>{[pub.publicationType, pub.series].filter(Boolean).join(" · ") || <Unidentified />}</dd></div>
              <div><dt>Documento</dt><dd>{pub.files.pages ? `${pub.files.pages} páginas` : NAO_IDENTIFICADO}{pub.files.bytes ? ` · ${formatBytes(pub.files.bytes)}` : ""}</dd></div>
              <div><dt>Identificador</dt><dd>
                {pub.identifier.doi ? <>DOI {pub.identifier.doi}</> : null}
                {pub.identifier.doi && pub.identifier.isbn ? " · " : null}
                {pub.identifier.isbn ? <>ISBN {pub.identifier.isbn}</> : null}
                {!pub.identifier.doi && !pub.identifier.isbn && !pub.identifier.url ? <Unidentified /> : null}
                {!pub.identifier.doi && !pub.identifier.isbn && pub.identifier.url ? <>Link: {pub.identifier.url}</> : null}
                {pub.identifier.source && pub.identifier.source !== NAO_IDENTIFICADO && <small className="d-note">Fonte: {pub.identifier.source}</small>}
              </dd></div>
            </dl>

            <Section title="Resumo" id="d-resumo">
              {pub.summary.synthesis ? <p className="d-text">{pub.summary.synthesis}</p> : <p><Unidentified /></p>}
              <p className="d-tag">Síntese da biblioteca, elaborada a partir do conteúdo do PDF; não é o resumo oficial.</p>
              {pub.summary.official && (
                <figure className="d-quote">
                  <blockquote>{pub.summary.official.text}</blockquote>
                  <figcaption>Trecho oficial do documento · {pub.summary.official.page}</figcaption>
                </figure>
              )}
            </Section>

            {pub.questions.length > 0 && <Section title="Questões investigadas" id="d-q"><List items={pub.questions} /></Section>}
            {pub.methods.length > 0 && <Section title="Metodologia" id="d-m"><List items={pub.methods} /></Section>}
            {pub.findings.length > 0 && <Section title="Principais resultados e contribuições" id="d-r"><List items={pub.findings} /></Section>}

            <Section title="Palavras-chave" id="d-k">
              {pub.keywords.length ? <ul className="d-chips">{pub.keywords.map((k) => <li key={k}>{k}</li>)}</ul> : <p><Unidentified /></p>}
              {pub.keywordsSource && <p className="d-tag">{pub.keywordsSource === "oficial" ? "Palavras-chave impressas no PDF." : "Palavras-chave elaboradas pela biblioteca; o PDF não traz palavras-chave."}</p>}
            </Section>

            {pub.relatedVersions.length > 0 && (
              <Section title="Publicações relacionadas" id="d-rel">
                <ul className="d-list">{pub.relatedVersions.map((r) => <li key={r.title}><strong>{r.title}</strong> <span className="muted">({r.kind})</span><br /><small className="muted">{r.reference}</small></li>)}</ul>
              </Section>
            )}

            {(pub.notes.length > 0 || pub.unidentified.length > 0) && (
              <Section title="Notas documentais" id="d-n">
                {pub.notes.length > 0 && <List items={pub.notes} />}
                {pub.unidentified.length > 0 && <p className="d-tag"><strong>Não identificado neste PDF:</strong> {pub.unidentified.join("; ")}.</p>}
              </Section>
            )}
          </article>

          <nav className="d-pager" aria-label="Navegar entre estudos">
            <button type="button" disabled={!prev} onClick={() => prev && onNavigate(prev)}><small>Anterior</small><span>{prev ? prev.title : "—"}</span></button>
            <button type="button" disabled={!next} onClick={() => next && onNavigate(next)}><small>Próximo</small><span>{next ? next.title : "—"}</span></button>
          </nav>
        </div>
      </div>
      {readerOpen && <PdfViewer pub={pub} onClose={onCloseReader} />}
    </dialog>
  );
}
