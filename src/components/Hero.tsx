import type { Library } from "../types";
import { yearRange } from "../lib/filter";

export function Hero({ lib }: { lib: Library }) {
  const n = lib.publications.length;
  const yr = yearRange(lib);
  const period = yr ? (yr[0] === yr[1] ? String(yr[0]) : `${yr[0]}–${yr[1]}`) : "Não identificado";
  const hasDerived = lib.publications.some((p) => p.yearBasis && p.yearBasis !== "impresso");
  const nums = lib.publications.map((p) => p.number).filter((x): x is number => x !== null);
  const series = nums.length ? `nº ${Math.min(...nums)}–${Math.max(...nums)}` : "Não identificado";
  return (
    <section className="hero wrap" aria-labelledby="hero-title">
      <div className="hero-head">
        <div>
          <p className="eyebrow">Projeto Amazônia 2030</p>
          <h1 id="hero-title">Biblioteca de estudos</h1>
        </div>
        <dl className="hero-stats">
          <div><dt>Publicações</dt><dd>{n}</dd></div>
          <div><dt>Período</dt><dd>{period}{hasDerived && <sup title="Alguns anos não estão impressos nos PDFs; veja a ficha de cada estudo.">*</sup>}</dd></div>
          <div><dt>Série</dt><dd>{series}</dd></div>
        </dl>
      </div>
      <p className="hero-lead">
        Os estudos publicados pelo Amazônia 2030, reunidos em uma estante digital. Cada publicação tem ficha documental,
        resumo e acesso ao PDF original, com a origem de cada informação indicada.
      </p>
    </section>
  );
}
