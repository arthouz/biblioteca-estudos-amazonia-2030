import { useEffect, useRef } from "react";
import { YEAR_BASIS_LABEL } from "../lib/format";

export function AboutDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} className="dialog" aria-labelledby="about-title" onClose={onClose} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
      <div className="dialog-in">
        <h2 id="about-title">Sobre os dados</h2>
        <p>Cada ficha foi montada a partir da leitura do próprio PDF. O que não foi encontrado no documento aparece como <em>Não identificado</em>, e nada foi completado por suposição.</p>
        <h3>Como ler as indicações</h3>
        <dl className="legend">
          <dt>Resumo da biblioteca</dt><dd>Síntese escrita para esta biblioteca a partir do conteúdo do PDF. Não é o resumo oficial.</dd>
          <dt>Trecho oficial</dt><dd>Passagem do próprio documento, com a página indicada.</dd>
          <dt>Ano sem asterisco</dt><dd>{YEAR_BASIS_LABEL.impresso}.</dd>
          <dt>Ano com asterisco (*)</dt><dd>{YEAR_BASIS_LABEL["fonte-secundaria"]}, ou {YEAR_BASIS_LABEL.inferido.toLowerCase()}. A ficha de cada estudo informa qual caso se aplica.</dd>
          <dt>Palavras-chave</dt><dd>Indicadas como “oficiais” quando impressas no PDF; caso contrário, foram elaboradas pela biblioteca.</dd>
          <dt>DOI</dt><dd>Quando não está impresso no PDF, vem da lista de estudos do Amazônia 2030 publicada em <em>Fatos da Amazônia 2026</em> e é identificado como fonte secundária.</dd>
        </dl>
        <p className="muted small">O ano de publicação não é o período analisado: quando o estudo informa os dados que usa, o período aparece em campo separado.</p>
        <div className="dialog-actions"><button type="button" className="btn" onClick={() => ref.current?.close()}>Fechar</button></div>
      </div>
    </dialog>
  );
}
