import type { ReactNode } from "react";

export function LoadingState() {
  return (
    <div className="state wrap" role="status" aria-live="polite" aria-busy="true">
      <div className="skeleton-row" aria-hidden="true">{Array.from({ length: 8 }).map((_, i) => <i key={i} style={{ height: 300 + (i % 3) * 20 }} />)}</div>
      <p className="visually-hidden">Carregando a biblioteca…</p>
    </div>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="state state-box wrap" role="alert">
      <h2>Não foi possível carregar a biblioteca</h2>
      <p>Os arquivos de dados não puderam ser lidos. Verifique a conexão e tente novamente.</p>
      <p className="muted small">Detalhe técnico: {message}</p>
      <button type="button" className="btn" onClick={onRetry}>Tentar novamente</button>
    </div>
  );
}
export function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="state state-box wrap" role="status">
      <h2>Nenhum estudo encontrado</h2>
      <p>Nenhuma publicação corresponde à combinação de filtros e busca atual.</p>
      <button type="button" className="btn" onClick={onClear}>Limpar filtros</button>
    </div>
  );
}
export function Unidentified({ children }: { children?: ReactNode }) {
  return <span className="unid">{children ?? "Não identificado"}</span>;
}
